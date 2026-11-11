import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'car_rental_project.settings')
django.setup()

from backend.models import UserProfile, Car

def seed():
    print("Connecting & Seeding data to MongoDB...")
    
    # 1. Ensure Super Admin
    admin_email = "admin@drivenow.com"
    if not UserProfile.objects.filter(email=admin_email).exists():
        admin = UserProfile.objects.create_superuser(
            email=admin_email,
            name="Super Admin",
            password="adminpassword123"
        )
        print(f"Created Admin: {admin_email} (Pass: adminpassword123)")
    else:
        admin = UserProfile.objects.get(email=admin_email)
        admin.is_staff = True
        admin.is_superuser = True
        admin.account_status = 'active'
        admin.save()
        print(f"Verified Admin: {admin_email}")

    # Ensure Nafisa as Admin if requested
    nafisa_email = "nafisa@gmail.com"
    if not UserProfile.objects.filter(email=nafisa_email).exists():
        nafisa = UserProfile.objects.create_superuser(
            email=nafisa_email,
            name="Nafisa Akter",
            password="nafisapassword123"
        )
        print(f"Created Admin: {nafisa_email} (Pass: nafisapassword123)")
    else:
        nafisa = UserProfile.objects.get(email=nafisa_email)
        nafisa.is_staff = True
        nafisa.is_superuser = True
        nafisa.save()
        print(f"Verified Admin: {nafisa_email}")

    # 2. Seed Cars
    sample_cars = [
        {
            "car_name": "Toyota Corolla Altis",
            "model": "2022",
            "price": Decimal("3500.00"),
            "availability": True,
            "description": "Premium 5-seater sedan with smooth automatic transmission and full climate control.",
            "route": "Dhaka -> Chittagong",
            "allow_custom_route": True,
            "image_path": "car1.png"
        },
        {
            "car_name": "Toyota Noah Hybrid",
            "model": "2020",
            "price": Decimal("4800.00"),
            "availability": True,
            "description": "Spacious 7-seater microbus, ideal for family tours and corporate group travels.",
            "route": "Dhaka -> Sylhet",
            "allow_custom_route": True,
            "image_path": "car2.png"
        },
        {
            "car_name": "Honda Vezel RS",
            "model": "2021",
            "price": Decimal("4200.00"),
            "availability": True,
            "description": "Sporty compact SUV with hybrid efficiency, cruise control, and elevated comfort.",
            "route": "Dhaka -> Cox's Bazar",
            "allow_custom_route": False,
            "image_path": "car3.png"
        },
        {
            "car_name": "Toyota Premio",
            "model": "2019",
            "price": Decimal("3800.00"),
            "availability": True,
            "description": "Executive luxury sedan with plush seating, silent cabin, and elegant finish.",
            "route": "Dhaka -> Khulna",
            "allow_custom_route": True,
            "image_path": "car4.png"
        },
        {
            "car_name": "Toyota HiAce Grand Cabin",
            "model": "2021",
            "price": Decimal("6500.00"),
            "availability": True,
            "description": "Luxury 11-seater van with dual AC, reclining seats, and massive luggage space.",
            "route": "Dhaka -> Rajshahi",
            "allow_custom_route": True,
            "image_path": "car5.png"
        },
        {
            "car_name": "Mitsubishi Pajero Sport",
            "model": "2022",
            "price": Decimal("8500.00"),
            "availability": True,
            "description": "Powerful 4WD SUV designed to dominate highways and off-road destinations with safety.",
            "route": "Dhaka -> Cox's Bazar",
            "allow_custom_route": True,
            "image_path": "car6.png"
        },
        {
            "car_name": "Toyota Allion",
            "model": "2020",
            "price": Decimal("3600.00"),
            "availability": True,
            "description": "Reliable city and highway commuter car with excellent fuel economy and comfort.",
            "route": "Dhaka -> Barisal",
            "allow_custom_route": False,
            "image_path": "car7.png"
        },
        {
            "car_name": "Hyundai Tucson",
            "model": "2023",
            "price": Decimal("5500.00"),
            "availability": True,
            "description": "Modern smart SUV with panoramic sunroof, advanced ADAS safety, and premium leather interior.",
            "route": "Dhaka -> Sylhet",
            "allow_custom_route": True,
            "image_path": "car8.png"
        }
    ]

    for data in sample_cars:
        car, created = Car.objects.update_or_create(
            car_name=data["car_name"],
            model=data["model"],
            defaults=data
        )
        if created:
            print(f"Added Car: {car.car_name} ({car.model})")
        else:
            print(f"Updated Car: {car.car_name} ({car.model})")

    print("\nSample Cars and Admins successfully pushed to MongoDB!")

if __name__ == "__main__":
    seed()
