import os
import stripe
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from backend.contract_types import Contract
from backend.stripe.sql_lookup_helpers import get_name_and_email_for_company_id, get_name_for_product_id

load_dotenv()

stripe.api_key = os.getenv("STRIPE_API_KEY")

def retrieve_stripe_customer(software_customer_id: str) -> Optional[stripe.Customer]:
    try:
        all_customers = stripe.Customer.list()
        for customer in all_customers.data:
            if customer.metadata.get("software_customer_id") == software_customer_id:
                return customer
        return None
    except stripe.error.StripeError as e:
        print(f"Error retrieving customer: {e.user_message}")
        return None

def retrieve_stripe_product(software_product_id: str) -> Optional[stripe.Product]:
    try:
        all_products = stripe.Product.list()
        for product in all_products.data:
            if product.metadata.get("software_product_id") == software_product_id:
                return product
        return None
    except stripe.error.StripeError as e:
        print(f"Error retrieving product: {e.user_message}")
        return None

def evaluate_stripe_to_contract(contract: Contract):
    # create a product if it doesn't exist, or retrieve the existing one
    stripe_product = retrieve_stripe_product(contract.product_id)
    if not stripe_product:
        stripe_product_id = create_stripe_product(name=get_name_for_product_id(contract.product_id), id=contract.product_id)
    else:
        stripe_product_id = stripe_product.id
    # create a price for the product (or find an existing one)
    price_id = find_price_for_product(stripe_product_id, currency=contract.currency)
    if not price_id:
        price_id = create_price_for_product(
            stripe_product_id=stripe_product_id,
            unit_amount=int(float(contract.unit_price) * 100),  # convert to cents
            currency=contract.currency,
        )
    # create a customer if it doesn't exist, or retrieve the existing one
    stripe_customer = retrieve_stripe_customer(contract.company_id)
    if not stripe_customer:
        (name, email) = get_name_and_email_for_company_id(contract.company_id)
        stripe_customer_id = create_stripe_customer(
            name=name, email=email, id=contract.company_id
        )
    else:
        stripe_customer_id = stripe_customer.id
    return (stripe_product_id, price_id, stripe_customer_id)

def create_invoice_for_contract(contract: Contract):
    (_, price_id, stripe_customer_id) = evaluate_stripe_to_contract(contract)
    invoice_id = create_empty_invoice(customer_id=stripe_customer_id)
    add_invoice_item_by_price(
        invoice_id=invoice_id,
        customer_id=stripe_customer_id,
        price_id=price_id,
        quantity=int(float(contract.quantity)),
    )
    return invoice_id

def create_stripe_customer(name: str, email: str, id: str) -> str:
    customer = stripe.Customer.create(name=name, email=email, metadata={"software_customer_id": id})
    return customer.id

def create_stripe_product(name: str, id: str) -> str:
    product = stripe.Product.create(name=name, metadata={"software_product_id": id})
    return product.id

def create_price_for_product(
    stripe_product_id: str,
    unit_amount: int,
    currency: str,
) -> str:
    """
    Create a Price for an existing Product.
    - unit_amount is in the smallest currency unit (usually cents)
    - recurring example: {"interval": "month"} or {"interval": "year"}
    """
    price = stripe.Price.create(
        product=stripe_product_id,
        unit_amount=unit_amount,
        currency=currency.lower(),
    )
    return price.id

def list_prices_for_product(
    stripe_product_id: str,
    active_only: bool = True,
    limit: int = 50,
) -> List[stripe.Price]:
    """
    Returns Stripe Price objects for a product (multiple prices supported).
    """
    prices = stripe.Price.list(
        product=stripe_product_id,
        active=active_only,
        limit=limit,
    )
    return prices.data

def list_all_customers() -> List[stripe.Customer]:
    customers = stripe.Customer.list()
    return customers.data

def find_price_for_product(
    stripe_product_id: str,
    currency: str,
) -> Optional[str]:
    """
    Convenience selector:
    - picks the first matching price by currency (+ optional interval/nickname).
    """
    currency = currency.lower()
    for p in list_prices_for_product(stripe_product_id):
        if p.currency != currency:
            continue
        return p.id
    return None

def create_empty_invoice(customer_id: str) -> str:
    """
    Currency is determined by invoice items (and must be consistent across them).
    """
    invoice = stripe.Invoice.create(
        customer=customer_id,
        auto_advance=False, # finalize manually
        collection_method="charge_automatically",
    )
    return invoice.id

def _get_invoice_currency(invoice_id: str) -> Optional[str]:
    inv = stripe.Invoice.retrieve(invoice_id)
    return inv.currency  # may be None until items exist

def add_invoice_item_by_price(
    invoice_id: str,
    customer_id: str,
    price_id: str,
    quantity: int = 1,
    description: Optional[str] = None,
) -> Optional[str]:
    """
    Adds an invoice item using a Price (recommended).
    Enforces: invoice currency must match the price currency.
    """
    try:
        price = stripe.Price.retrieve(price_id)
        price_currency = price.currency

        existing_currency = _get_invoice_currency(invoice_id)
        if existing_currency and existing_currency.lower() != price_currency.lower():
            raise ValueError(
                f"Invoice currency is '{existing_currency}', but price currency is '{price_currency}'. "
                "Stripe invoices must be single-currency."
            )

        item = stripe.InvoiceItem.create(
            customer=customer_id,
            invoice=invoice_id,
            pricing={"price": price_id},
            quantity=quantity,
            description=description,
        )
        return item.id

    except (stripe.error.StripeError, ValueError) as e:
        msg = getattr(e, "user_message", None) or str(e)
        print(f"Error adding invoice item: {msg}")
        return None

def finalize_invoice(invoice_id: str) -> Optional[str]:
    try:
        invoice = stripe.Invoice.finalize_invoice(invoice_id)
        return invoice.id
    except stripe.error.StripeError as e:
        print(f"Error finalizing invoice: {e.user_message}")
        return None

def pay_invoice(invoice_id: str) -> Optional[str]:
    """
    Works if the customer has a default payment method (or invoice has a payable payment_intent).
    """
    try:
        invoice = stripe.Invoice.pay(invoice_id)
        return invoice.id
    except stripe.error.StripeError as e:
        print(f"Error paying invoice: {e.user_message}")
        return None

def retrieve_invoice_data(invoice_id: str) -> str:
    try:
        invoice = stripe.Invoice.retrieve(invoice_id)
        return invoice
    except stripe.error.StripeError as e:
        print(f"Error retrieving invoice: {e.user_message}")
        return "error"