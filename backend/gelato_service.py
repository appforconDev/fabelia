import os
import requests
import uuid
import fitz  # PyMuPDF för att läsa PDF-sidor

# API-inställningar
GELATO_API_KEY = os.getenv("GELATO_API_KEY")
GELATO_API_URL = "https://order.gelatoapis.com/v4/orders"

HEADERS = {
    "X-API-KEY": GELATO_API_KEY,
    "Content-Type": "application/json",
}




def get_pdf_page_count(pdf_path):
    """
    ✅ Räknar det faktiska antalet sidor i PDF-filen.
    """
    try:
        with fitz.open(pdf_path) as doc:
            page_count = len(doc)
            print(f"📄 PDF-fil: {pdf_path} innehåller {page_count} sidor.")
            return page_count
    except Exception as e:
        print(f"❌ Kunde inte räkna sidor i PDF: {e}")
        return None

def adjust_page_count(page_count):
    """
    ✅ Justera page_count enligt Gelato's regler:
    - Måste vara jämnt (2 sidor per ark)
    - Lägg till 1 sida om den är udda
    """
    if page_count % 2 != 0:
        print(f"⚠️ Sidantal ({page_count}) är udda, lägger till +1 sida för att göra det jämnt.")
        page_count -= 1

    return page_count

def order_book_with_gelato(pdf_url, adjusted_page_count, customer_name, address, city, country, postal_code, email):
    """
    Skapar en beställning av boken på Gelato och skickar den till kundens adress.
    """

    fake_page_count = adjusted_page_count 
    print(f"📦 Skickar till Gelato: {fake_page_count} sidor (Faktiskt: {adjusted_page_count})")


    # Skapa payload för beställningen
    payload = {
        "orderType": "order",
        "orderReferenceId": f"order-{uuid.uuid4().hex[:8]}",  # Unikt order-ID
        "customerReferenceId": f"customer-{uuid.uuid4().hex[:8]}",  # Unikt kund-ID
        "currency": "USD",
        "items": [
            {
                "itemReferenceId": f"item-{uuid.uuid4().hex[:8]}",  # Unikt item-ID
                "productUid": os.getenv("GELATO_PRODUCT_ID"),  # Se till att rätt produkt-ID används
                "files": [
                    {
                        "type": "default",
                        "url": pdf_url  # Använder PDF-URL direkt
                    }
                ],
                "quantity": 1,
                "pageCount": int(fake_page_count) # 🔥 Använder det redan justerade sidantalet
            }
        ],
        "shipmentMethodUid": "standard",
        "shippingAddress": {
            #"companyName": customer_name,
            "firstName": customer_name.split()[0] if " " in customer_name else customer_name,
            "lastName": customer_name.split()[-1] if " " in customer_name else "N/A",
            "addressLine1": address,
            "city": city,
            "state": "",
            "postCode": postal_code,
            "country": country,
            "email": email
        }
    }

    try:
        # Skicka beställningen till Gelato API
        response = requests.post(GELATO_API_URL, headers=HEADERS, json=payload, timeout=30)
        
        if response.status_code == 201:
            order_data = response.json()
            print(f"✅ Bokbeställning skapad! Order-ID: {order_data['id']}")
            return order_data
        else:
            print(f"❌ Fel vid beställning: {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ API-anrop misslyckades: {str(e)}")
        return None
    except Exception as e:
        print(f"❌ Oväntat fel vid beställning: {str(e)}")
        return None
