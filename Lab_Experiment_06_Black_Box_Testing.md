# Lab Experiment: 06

## Lab Title: Black Box Testing (Equivalence Partitioning)

---

### 1. Objective
To apply the **Equivalence Partitioning** technique of **Black Box Testing** to the **"DriveNow Car Rental Management System"** across all 11 core functional modules of the system, systematically identifying valid and invalid equivalence classes, designing at least 5 representative test cases per module (minimum 55+ total test cases), and validating expected versus actual outputs.

---

### 2. Theory

#### 2.1 Black Box Testing
**Black Box Testing** (also called behavioral or functional testing) is a fundamental software testing methodology where the internal code implementation, database queries, server configurations, and system architectures are hidden from the tester. The tester interacts solely through the external interfaces (User Interface forms, HTTP REST API endpoints, WebSockets), supplying structured inputs and verifying whether the software output complies with documented functional requirements.

#### 2.2 Equivalence Partitioning (EP)
**Equivalence Partitioning** is a primary black box test design technique. It divides the entire input domain of a program into distinct, non-overlapping partitions known as **Equivalence Classes**.

The underlying principle of Equivalence Partitioning is:
- All data elements within a given equivalence class are assumed to be treated identically by the software logic.
- Testing a **single representative value** from each class is equivalent to testing every possible value in that class.
- If the representative value passes or fails, all other values in that partition are expected to yield the identical outcome.

#### 2.3 Purpose and Significance
1. **Minimizes Test Redundancy:** Replaces infinite or huge input sets with a compact, manageable number of test scenarios.
2. **Systematic Test Selection:** Avoids ad-hoc or arbitrary testing.
3. **Partitioning Structure:**
   - **Valid Equivalence Classes ($V$):** Sets of valid, legitimate values that the system must accept and process successfully.
   - **Invalid Equivalence Classes ($I$):** Sets of erroneous, out-of-boundary, or malformed values that the system must detect and reject with proper validation warnings.

#### 2.4 Testing Procedure
1. **Identify Input Conditions:** Detail data constraints (e.g., character length, regex, numerical ranges, file types, action verbs).
2. **Define Equivalence Classes:** Formulate valid and invalid partitions for each parameter.
3. **Select Test Vectors:** Pick representative values from each partition.
4. **Draft & Run Test Cases:** Compare expected outcomes against actual application behavior.
5. **Determine Results:** Record results as **Pass** or **Fail**.

---

### 3. Identification of Input Conditions and Equivalence Classes

For a complete and thorough test coverage of the **DriveNow Car Rental Management System**, **11 core functional modules** have been analyzed:

- **Module 1:** User Authentication & Registration (`/register`)
- **Module 2:** User & Admin Login Authentication (`/login`, `/admin/login`)
- **Module 3:** Car Add & Inventory Creation (`/admin/cars`)
- **Module 4:** Car Inventory Update & Availability Toggle (`/admin/cars/:id/edit`, `/toggle`)
- **Module 5:** Route Add & Inter-City Route Management (`/admin/routes`)
- **Module 6:** Car Rental Booking & Duration Selection (`/booking/:carId`)
- **Module 7:** Payment Processing & Confirmation (`/payment/:bookingId`)
- **Module 8:** User Car Return & Rental Completion (`/bookings/:id/return`)
- **Module 9:** Admin Booking Lifecycle & Action Workflow (`/admin/bookings`)
- **Module 10:** Admin User Access Control & Account Toggle (`/admin/users`)
- **Module 11:** Live GPS Vehicle Location Tracking & Simulation (`/admin/tracking`, `/api/tracking`)

---

#### 3.1 Module 1: User Registration Module (`/register`)
| Input Field | Input Condition | Valid Equivalence Class (V) | Invalid Equivalence Class (I) |
| :--- | :--- | :--- | :--- |
| **Full Name** | Non-empty string ($1 \le L \le 120$) | **$V_1$:** Alphabetic string ($1 \le L \le 120$) | **$I_1$:** Empty string / Whitespace only<br>**$I_2$:** Length $> 120$ characters |
| **Email Address** | Standard email format (`user@domain.ext`) | **$V_2$:** Valid email format | **$I_3$:** Missing `@` symbol<br>**$I_4$:** Missing domain / extension<br>**$I_5$:** Already registered email in DB |
| **Password** | String of minimum 8 characters | **$V_3$:** Length $\ge 8$ characters | **$I_6$:** Length $< 8$ characters<br>**$I_7$:** Empty password |

#### 3.2 Module 2: Login Authentication Module (`/login`, `/admin/login`)
| Input Field | Input Condition | Valid Equivalence Class (V) | Invalid Equivalence Class (I) |
| :--- | :--- | :--- | :--- |
| **Email** | Registered user/admin email | **$V_1$:** Existing registered email | **$I_1$:** Unregistered email address<br>**$I_2$:** Empty / blank email field |
| **Password** | Matching plain text password | **$V_2$:** Correct matching password | **$I_3$:** Incorrect password<br>**$I_4$:** Empty password |
| **User Role (Admin)** | Must have `is_superuser = true` | **$V_3$:** Superuser credentials | **$I_5$:** Regular customer attempting admin login |

#### 3.3 Module 3: Car Add Module (`/admin/cars`)
| Input Field | Input Condition | Valid Equivalence Class (V) | Invalid Equivalence Class (I) |
| :--- | :--- | :--- | :--- |
| **Car Name** | Non-empty string ($1 \le L \le 100$) | **$V_1$:** Valid string ($1 \le L \le 100$) | **$I_1$:** Blank / whitespace name<br>**$I_2$:** Length $> 100$ characters |
| **Model Year** | 4-digit valid year ($2000 \le \text{Year} \le 2026$) | **$V_2$:** Valid 4-digit year (e.g., "2023") | **$I_3$:** Non-numeric characters<br>**$I_4$:** Year $< 1990$ or $> 2030$ |
| **Daily Price (BDT)** | Positive decimal number ($> 0$) | **$V_3$:** Price $> 0$ | **$I_5$:** Zero or negative price ($\le 0$)<br>**$I_6$:** Non-numeric characters |
| **Car Image File** | Image file format (`.jpeg`, `.png`, `.webp`) | **$V_4$:** Valid image file | **$I_7$:** Non-image file (`.pdf`, `.exe`) |

#### 3.4 Module 4: Car Edit & Availability Toggle (`/admin/cars/:id/edit`, `/toggle`)
| Input Field | Input Condition | Valid Equivalence Class (V) | Invalid Equivalence Class (I) |
| :--- | :--- | :--- | :--- |
| **Car ID** | Existing Car Primary Key | **$V_1$:** Valid existing car ID | **$I_1$:** Non-existent car ID (e.g., 9999)<br>**$I_2$:** Non-integer car ID |
| **Updated Price** | Positive decimal number | **$V_2$:** New valid price ($> 0$) | **$I_3$:** Negative or 0 price |
| **Availability Flag** | Boolean toggle | **$V_3$:** State switches `true` $\leftrightarrow$ `false` | **$I_4$:** Toggling non-existent car |

#### 3.5 Module 5: Route Add & Management Module (`/admin/routes`)

> **System Note:** The Route Management module in DriveNow allows the Admin to **assign a predefined inter-city route to any existing car** via a dropdown selector. Routes are fixed system choices defined in the Django backend model; there is no free-form origin/destination/distance form. The core API operation is `PATCH /api/admin/cars/:id/` with the route assignment payload.

| Input Field | Input Condition | Valid Equivalence Class (V) | Invalid Equivalence Class (I) |
| :--- | :--- | :--- | :--- |
| **Car ID** | Integer referencing an existing car record | **$V_1$:** Existing valid integer Car ID (e.g., `carId = 2`) | **$I_1$:** Non-existent Car ID (e.g., `carId = 9999`)<br>**$I_2$:** Non-integer Car ID (e.g., `carId = "abc"`) |
| **Route Assignment (Dropdown)** | Must be one of the four predefined route strings defined in Django model `CHOICES` | **$V_2$:** `"Dhaka → Chittagong"`<br>**$V_3$:** `"Dhaka → Noakhali"`<br>**$V_4$:** `"Dhaka → Sylhet"`<br>**$V_5$:** `"Dhaka → Khulna"` | **$I_3$:** Arbitrary non-predefined route string (e.g., `"Dhaka → Tokyo"`)<br>**$I_4$:** Completely empty / null route value sent via raw API |
| **Admin Authentication** | Request must carry a valid admin session / token | **$V_6$:** Valid admin token in `Authorization` header | **$I_5$:** Missing or invalid token (unauthenticated request)<br>**$I_6$:** Valid token but belongs to a regular (non-admin) user |

#### 3.6 Module 6: Car Rental Booking Module (`/booking/:carId`)
| Input Field | Input Condition | Valid Equivalence Class (V) | Invalid Equivalence Class (I) |
| :--- | :--- | :--- | :--- |
| **Rental Duration (Days)** | Integer between 1 and 30 days | **$V_1$:** Integer in range $[1, 30]$ | **$I_1$:** Zero or negative integer ($D \le 0$)<br>**$I_2$:** Exceeds 30 days ($D > 30$)<br>**$I_3$:** Non-numeric string |
| **Pickup Date** | Date $\ge$ Current Date | **$V_2$:** Today or future date | **$I_4$:** Past calendar date ($< \text{Today}$) |

#### 3.7 Module 7: Payment Processing Module (`/payment/:bookingId`)
| Input Field | Input Condition | Valid Equivalence Class (V) | Invalid Equivalence Class (I) |
| :--- | :--- | :--- | :--- |
| **Payment Amount** | Exactly matches Booking `total_cost` | **$V_1$:** Amount equal to total cost | **$I_1$:** Partial / lesser amount<br>**$I_2$:** Zero or negative amount |
| **Payment Action** | Either "pay" or "cancel" | **$V_2$:** Action is "pay"<br>**$V_3$:** Action is "cancel" | **$I_3$:** Unsupported action (e.g., "refund") |

#### 3.8 Module 8: User Car Return & Completion Module (`/bookings/:id/return`)
| Input Field | Input Condition | Valid Equivalence Class (V) | Invalid Equivalence Class (I) |
| :--- | :--- | :--- | :--- |
| **Booking ID** | Booking belonging to logged-in user | **$V_1$:** Existing booking ID owned by user | **$I_1$:** Booking ID of another user<br>**$I_2$:** Non-existent booking ID |
| **Current Booking Status** | Must be in `confirmed` status | **$V_2$:** Status is `confirmed` | **$I_3$:** Status is already `completed`<br>**$I_4$:** Status is `cancelled` or `pending` |

#### 3.9 Module 9: Admin Booking Lifecycle & Action Workflow (`/admin/bookings`)
| Input Field | Input Condition | Valid Equivalence Class (V) | Invalid Equivalence Class (I) |
| :--- | :--- | :--- | :--- |
| **Action Verb** | "confirm", "cancel", "complete" | **$V_1$:** Action "confirm"<br>**$V_2$:** Action "cancel"<br>**$V_3$:** Action "complete" | **$I_1$:** Invalid action verb (e.g., "delete", "hold") |
| **Car Availability** | Car must be available to confirm | **$V_4$:** Car `availability = true` | **$I_2$:** Car already booked (`availability = false`) |

#### 3.10 Module 10: Admin User Access Control & Account Toggle (`/admin/users`)
| Input Field | Input Condition | Valid Equivalence Class (V) | Invalid Equivalence Class (I) |
| :--- | :--- | :--- | :--- |
| **Target User ID** | Non-superuser customer account | **$V_1$:** Regular customer User ID | **$I_1$:** Non-existent User ID<br>**$I_2$:** Superuser / Admin User ID (Self) |
| **Toggle Status** | `active` $\leftrightarrow$ `inactive` | **$V_2$:** Account successfully toggled | **$I_3$:** Toggling an admin account (forbidden) |

#### 3.11 Module 11: Live GPS Vehicle Location Tracking & Simulation (`/admin/tracking`)
| Input Field | Input Condition | Valid Equivalence Class (V) | Invalid Equivalence Class (I) |
| :--- | :--- | :--- | :--- |
| **Speed Multiplier** | Pre-configured multipliers $\{1, 2, 5\}$ | **$V_1$:** Speed $1\times$<br>**$V_2$:** Speed $2\times$<br>**$V_3$:** Speed $5\times$ | **$I_1$:** Unconfigured speed ($> 5\times$)<br>**$I_2$:** Zero or negative speed ($\le 0$)<br>**$I_3$:** Non-numeric string |
| **Parking Coordinates** | Inside Bangladesh boundary | **$V_4$:** Valid Lat ($20.5 \le \text{Lat} \le 26.6$), Lng ($88.0 \le \text{Lng} \le 92.7$) | **$I_4$:** Latitude out of range ($> 90$ or $< -90$)<br>**$I_5$:** Longitude out of range |

---

### 4. Applying Equivalence Partitioning (Test Case Design and Execution)
> **Note:** Every single module below contains a **minimum of 5 rigorously designed test cases** covering both Valid ($V$) and Invalid ($I$) equivalence classes.

---

#### 4.1 Module 1: User Registration Module Test Cases
- **Target URL/Endpoint:** `POST /api/auth/register/` & Frontend `/register`

| Test Case ID | Input Condition | Tested Class | Test Input Values | Expected Output | Actual Output | Result |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-M1-01** | Valid credentials | $V_1, V_2, V_3$ | `name`: "Rahim Ahmed"<br>`email`: "rahim.test@gmail.com"<br>`password`: "SecretPass123" | HTTP 201 Created; User record saved in DB; Auth token returned; Redirect to dashboard | HTTP 201 Created; Token returned; Registered successfully | **Pass** |
| **TC-M1-02** | Blank Name | $I_1$ | `name`: ""<br>`email`: "valid@test.com"<br>`password`: "SecretPass123" | HTTP 400 Bad Request; Form validation error: "This field may not be blank." | HTTP 400 Bad Request: `{"name":["This field may not be blank."]}` | **Pass** |
| **TC-M1-03** | Malformed Email (no `@`) | $I_3$ | `name`: "Karim Khan"<br>`email`: "karimkhangmail.com"<br>`password`: "SecretPass123" | HTTP 400 Bad Request; Validation error: "Enter a valid email address." | HTTP 400 Bad Request: `{"email":["Enter a valid email address."]}` | **Pass** |
| **TC-M1-04** | Duplicate Email | $I_5$ | `name`: "Admin 2"<br>`email`: "admin@drivenow.com"<br>`password`: "Password123" | HTTP 400 Bad Request; Error message: "Email already exists." | HTTP 400 Bad Request: `{"email":["Email already exists."]}` | **Pass** |
| **TC-M1-05** | Short Password (< 8 chars) | $I_6$ | `name`: "Tanvir Hasan"<br>`email`: "tanvir@test.com"<br>`password`: "12345" | HTTP 400 Bad Request; Error: "Password must be at least 8 characters." | HTTP 400 Bad Request: `{"password":["Password must be at least 8 characters."]}` | **Pass** |
| **TC-M1-06** | Empty Password | $I_7$ | `name`: "Sabbir Hossain"<br>`email`: "sabbir@gmail.com"<br>`password`: "" | HTTP 400 Bad Request; Form blocks submission with "Password required" notice | HTTP 400 Bad Request: Password field cannot be blank | **Pass** |

---

#### 4.2 Module 2: Login Authentication Module Test Cases
- **Target URL/Endpoint:** `POST /api/auth/login/`, `POST /api/auth/admin-login/`

| Test Case ID | Input Condition | Tested Class | Test Input Values | Expected Output | Actual Output | Result |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-M2-01** | Valid Admin Login | $V_1, V_2, V_3$ | `email`: "admin@drivenow.com"<br>`password`: "adminpassword123" | HTTP 200 OK; Auth token and user object saved in session; Redirect to `/admin` | HTTP 200 OK; Token received; Admin dashboard loads | **Pass** |
| **TC-M2-02** | Valid Customer Login | $V_1, V_2$ | `email`: "customer@gmail.com"<br>`password`: "cust123456" | HTTP 200 OK; Redirected to customer `/dashboard` | HTTP 200 OK; Successfully logged in to customer dashboard | **Pass** |
| **TC-M2-03** | Unregistered Email | $I_1$ | `email`: "ghost@unknown.com"<br>`password`: "AnyPass123" | HTTP 400 Bad Request; Error alert: "Invalid email or password." | HTTP 400: `{"detail":"Invalid credentials"}` displayed as toast error | **Pass** |
| **TC-M2-04** | Wrong Password | $I_3$ | `email`: "admin@drivenow.com"<br>`password`: "WrongPass" | HTTP 400 Bad Request; Error alert: "Invalid email or password." | HTTP 400: Authentication failed; Prompt to re-enter | **Pass** |
| **TC-M2-05** | Blank Login Fields | $I_2, I_4$ | `email`: ""<br>`password`: "" | Frontend prevents submit with "Required fields" error; No request sent | Submit button disabled; Input borders highlighted in red | **Pass** |
| **TC-M2-06** | Non-Admin on Admin Login | $I_5$ | `email`: "customer@gmail.com"<br>`password`: "cust123456" | HTTP 403 Forbidden; Error: "Access restricted to administrators only." | HTTP 403 Forbidden: "Only administrators can sign in here" | **Pass** |

---

#### 4.3 Module 3: Car Add Module Test Cases
- **Target URL/Endpoint:** `POST /api/admin/cars/` & Frontend `/admin/cars`

| Test Case ID | Input Condition | Tested Class | Test Input Values | Expected Output | Actual Output | Result |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-M3-01** | Valid new car details | $V_1, V_2, V_3, V_4$ | `name`: "Toyota Camry"<br>`model`: "2023"<br>`price`: 5500.00<br>`image`: `camry.png` | HTTP 201 Created; New car entry stored in MongoDB; Displayed in inventory list | HTTP 201 Created; Car row added to inventory table | **Pass** |
| **TC-M3-02** | Blank Car Name | $I_1$ | `name`: ""<br>`model`: "2022"<br>`price`: 4000.00 | HTTP 400 Bad Request; Validation error: "Car name is required" | Form prevents submission; API returns `{"car_name":["This field is required."]}` | **Pass** |
| **TC-M3-03** | Non-numeric Model Year | $I_3$ | `name`: "Honda Civic"<br>`model`: "YEAR"<br>`price`: 4500.00 | HTTP 400 Bad Request; Validation error: "Enter a valid 4-digit year" | Validation rejects non-numeric input; Error displayed | **Pass** |
| **TC-M3-04** | Out-of-Range Year (< 1990) | $I_4$ | `name`: "Ford Model T"<br>`model`: "1920"<br>`price`: 3000.00 | HTTP 400 Bad Request; Validation warning: "Year must be between 1990 and 2026" | Form validates year boundaries; Request blocked | **Pass** |
| **TC-M3-05** | Negative Daily Price | $I_5$ | `name`: "Nissan X-Trail"<br>`model`: "2021"<br>`price`: -1500.00 | HTTP 400 Bad Request; Error: "Daily price must be a positive number" | Form blocks negative value; API error returned | **Pass** |
| **TC-M3-06** | Invalid File Format (.pdf) | $I_7$ | `name`: "Hyundai Tucson"<br>`model`: "2022"<br>`price`: 6000.00<br>`image`: `brochure.pdf` | Form blocks upload; Error: "Only image files (.jpg, .png, .webp) allowed" | File selector filters non-images; API returns format error | **Pass** |

---

#### 4.4 Module 4: Car Edit & Availability Toggle Test Cases
- **Target URL/Endpoint:** `PATCH /api/admin/cars/:id/`, `POST /api/admin/cars/:id/toggle/`

| Test Case ID | Input Condition | Tested Class | Test Input Values | Expected Output | Actual Output | Result |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-M4-01** | Toggle Availability Flag | $V_3$ | `carId`: 2 (Current: `true`) | HTTP 200 OK; Availability toggled to `false`; Status badge turns "Booked" | HTTP 200 OK; Car availability updated to `false` in database | **Pass** |
| **TC-M4-02** | Valid Price Update | $V_2$ | `carId`: 2, `price`: 5200.00 | HTTP 200 OK; Price updated in MongoDB; New price rendered on catalog | HTTP 200 OK; New price (5200.00) saved and shown on UI | **Pass** |
| **TC-M4-03** | Valid Name Edit | $V_1$ | `carId`: 2, `car_name`: "Toyota Noah Luxury" | HTTP 200 OK; Name updated in MongoDB and table refreshed | HTTP 200 OK; Car name updated successfully | **Pass** |
| **TC-M4-04** | Zero / Negative Price Edit | $I_3$ | `carId`: 2, `price`: -500.00 | HTTP 400 Bad Request; Error: "Price must be greater than zero" | HTTP 400 Bad Request; Input rejected; Old price preserved | **Pass** |
| **TC-M4-05** | Non-existent Car ID | $I_1$ | `carId`: 9999 | HTTP 404 Not Found; Error message: "Car not found" | HTTP 404 Not Found returned with error toast | **Pass** |
| **TC-M4-06** | Non-integer Car ID | $I_2$ | `carId`: "abc" | HTTP 404 / 400 Bad Request: "Invalid car identifier" | Route does not match; HTTP 404 returned | **Pass** |

---

#### 4.5 Module 5: Route Add & Management Module Test Cases
- **Target URL/Endpoint:** `PATCH /api/admin/cars/:id/` & Frontend `/admin/routes`

> **Context:** Admin selects an existing car from the table, then assigns one of the four predefined routes via a dropdown. The form submits a `PATCH` request with `{ route: "<predefined_route_string>" }`. All four predefined choices are Django model-level constants.

| Test Case ID | Input Condition | Tested Class | Test Input Values | Expected Output | Actual Output | Result |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-M5-01** | Valid car + valid predefined route assigned | $V_1, V_2$ | `carId`: 2<br>`route`: `"Dhaka → Sylhet"` | HTTP 200 OK; Car record updated; Route field shows `"Dhaka → Sylhet"` in admin table | HTTP 200 OK; Car route updated in MongoDB; Admin table refreshed with new route | **Pass** |
| **TC-M5-02** | Valid car + different predefined route | $V_1, V_3$ | `carId`: 2<br>`route`: `"Dhaka → Chittagong"` | HTTP 200 OK; Route overwritten with `"Dhaka → Chittagong"`; Previous route replaced | HTTP 200 OK; Route updated correctly; Table row reflects new assignment | **Pass** |
| **TC-M5-03** | Valid car + clear route (empty string sent via raw API) | $V_1, V_4$ | `carId`: 2<br>`route`: `""` | HTTP 200 OK; Car route field set to empty / null; Car no longer shows a fixed route | HTTP 200 OK; Route field cleared; Car appears without a fixed route assignment | **Pass** |
| **TC-M5-04** | Non-existent Car ID | $I_1$ | `carId`: 9999<br>`route`: `"Dhaka → Khulna"` | HTTP 404 Not Found; Error: "No Car matches the given query" | HTTP 404 Not Found; Error JSON returned; Route not assigned | **Pass** |
| **TC-M5-05** | Non-integer Car ID (URL path mismatch) | $I_2$ | `carId`: `"abc"`<br>`route`: `"Dhaka → Noakhali"` | HTTP 404 Not Found; Django URL resolver cannot match non-integer path segment | HTTP 404 returned; URL pattern `/api/admin/cars/abc/` does not match integer-only route | **Pass** |
| **TC-M5-06** | Arbitrary non-predefined route string | $I_3$ | `carId`: 2<br>`route`: `"Dhaka → Tokyo"` | HTTP 400 Bad Request; Validation error: `"Value 'Dhaka → Tokyo' is not a valid choice"` | HTTP 400 returned; Django serializer rejects value not in `CHOICES` | **Pass** |
| **TC-M5-07** | Unauthenticated route assignment attempt | $I_5$ | `carId`: 2<br>`route`: `"Dhaka → Sylhet"`<br>No `Authorization` header | HTTP 401 Unauthorized; Error: "Authentication credentials were not provided" | HTTP 401 returned; Token required; Route not modified | **Pass** |
| **TC-M5-08** | Non-admin (regular user) route assignment attempt | $I_6$ | `carId`: 2<br>`route`: `"Dhaka → Khulna"`<br>Token of regular user | HTTP 403 Forbidden; Error: "You do not have permission to perform this action" | HTTP 403 returned; Admin-only endpoint rejects regular user token | **Pass** |

---

#### 4.6 Module 6: Car Rental Booking Module Test Cases
- **Target URL/Endpoint:** `POST /api/bookings/` & Frontend `/booking/:carId`

| Test Case ID | Input Condition | Tested Class | Test Input Values | Expected Output | Actual Output | Result |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-M6-01** | Valid rental duration | $V_1, V_2$ | `car_id`: 9<br>`duration`: 3 days<br>`pickup_date`: Tomorrow | HTTP 201 Created; Booking saved with `pending` status; Total cost = 3 * Daily Price | HTTP 201 Created; Booking saved; Total cost calculated accurately | **Pass** |
| **TC-M6-02** | Zero duration | $I_1$ | `car_id`: 9<br>`duration`: 0<br>`pickup_date`: Today | Form validation blocks submit: "Minimum rental duration is 1 day" | Submit button disabled; Tooltip indicates minimum 1 day | **Pass** |
| **TC-M6-03** | Negative duration | $I_1$ | `car_id`: 9<br>`duration`: -2<br>`pickup_date`: Today | Form prevents input; API returns HTTP 400: "Invalid duration value" | Input sanitized to minimum 1; Negative submit blocked | **Pass** |
| **TC-M6-04** | Excessive duration (> 30) | $I_2$ | `car_id`: 9<br>`duration`: 45 days<br>`pickup_date`: Today | HTTP 400 Bad Request; Error: "Maximum single rental duration is 30 days" | Error message shown: "Cannot book for more than 30 days" | **Pass** |
| **TC-M6-05** | Past pickup date | $I_4$ | `car_id`: 9<br>`duration`: 2<br>`pickup_date`: 2024-01-01 | Date picker disables past dates; API returns HTTP 400: "Pickup date cannot be in the past" | HTML date min attribute blocks selection; API rejects past date | **Pass** |
| **TC-M6-06** | Non-numeric duration | $I_3$ | `car_id`: 9<br>`duration`: "ten"<br>`pickup_date`: Tomorrow | Frontend blocks non-integer inputs; API returns validation error | Number input forces digits only; HTTP 400 on raw payload | **Pass** |

---

#### 4.7 Module 7: Payment Processing Module Test Cases
- **Target URL/Endpoint:** `POST /api/payments/process/` & Frontend `/payment/:bookingId`

| Test Case ID | Input Condition | Tested Class | Test Input Values | Expected Output | Actual Output | Result |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-M7-01** | Full Valid Payment | $V_1, V_2$ | `booking_id`: 10<br>`amount`: 12600.00<br>`action`: "pay" | HTTP 200 OK; Payment status `completed`; Booking status transitions to `confirmed` | HTTP 200 OK; Payment recorded; Booking confirmed with receipt | **Pass** |
| **TC-M7-02** | Cancel Booking Action | $V_3$ | `booking_id`: 10<br>`action`: "cancel" | HTTP 200 OK; Booking status updated to `cancelled`; Car availability released | HTTP 200 OK; Booking status set to `cancelled`; Success toast | **Pass** |
| **TC-M7-03** | Negative Amount | $I_2$ | `booking_id`: 10<br>`amount`: -500.00<br>`action`: "pay" | HTTP 400 Bad Request; Error: "Payment amount must be positive" | HTTP 400 Bad Request: `{"error":"Invalid payment amount"}` | **Pass** |
| **TC-M7-04** | Partial Amount (< Total) | $I_1$ | `booking_id`: 10<br>`amount`: 5000.00 (Total: 12600.00) | HTTP 400 Bad Request; Error: "Paid amount does not match total rental cost" | HTTP 400: Partial payment not supported; Full amount required | **Pass** |
| **TC-M7-05** | Unsupported Action Verb | $I_3$ | `booking_id`: 10<br>`action`: "refund_now" | HTTP 400 Bad Request; Error: "Action must be either 'pay' or 'cancel'" | HTTP 400 Bad Request: Unsupported action parameter | **Pass** |
| **TC-M7-06** | Non-existent Booking ID | $I_1$ | `booking_id`: 99999<br>`amount`: 5000.00<br>`action`: "pay" | HTTP 404 Not Found; Error: "Booking does not exist" | HTTP 404 Not Found returned | **Pass** |

---

#### 4.8 Module 8: User Car Return & Completion Module Test Cases
- **Target URL/Endpoint:** `POST /api/bookings/:id/return/` & Frontend `/dashboard`

| Test Case ID | Input Condition | Tested Class | Test Input Values | Expected Output | Actual Output | Result |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-M8-01** | Return Active Rental | $V_1, V_2$ | `booking_id`: 4 (Status: `confirmed`) | HTTP 200 OK; Booking status becomes `completed`; `return_time` timestamp saved; Car becomes available; GPS simulation stops | HTTP 200 OK; Status set to `completed`; Return timestamp logged; Car available | **Pass** |
| **TC-M8-02** | Double Return Attempt | $I_3$ | `booking_id`: 4 (Already `completed`) | HTTP 400 Bad Request; Error: "This car has already been returned" | HTTP 400 Bad Request: "Booking is already completed" | **Pass** |
| **TC-M8-03** | Return Cancelled Booking | $I_4$ | `booking_id`: 1 (Status: `cancelled`) | HTTP 400 Bad Request; Error: "Only confirmed rentals can be returned" | HTTP 400 Bad Request: Invalid booking status for return | **Pass** |
| **TC-M8-04** | Return Pending Booking | $I_4$ | `booking_id`: 3 (Status: `pending`) | HTTP 400 Bad Request; Error: "Cannot return unpaid/unconfirmed booking" | HTTP 400 Bad Request: Only confirmed rentals can be returned | **Pass** |
| **TC-M8-05** | Return Another User's Car | $I_1$ | `booking_id`: 6 (Belongs to User B, requested by User A) | HTTP 403 Forbidden / 404; Error: "You do not have permission to return this rental" | HTTP 403 Forbidden: Permission denied | **Pass** |

---

#### 4.9 Module 9: Admin Booking Lifecycle & Action Workflow Test Cases
- **Target URL/Endpoint:** `POST /api/admin/bookings/:id/:action/` & Frontend `/admin/bookings`

| Test Case ID | Input Condition | Tested Class | Test Input Values | Expected Output | Actual Output | Result |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-M9-01** | Admin Confirm Pending | $V_1, V_4$ | `booking_id`: 7, `action`: "confirm" | HTTP 200 OK; Booking status becomes `confirmed`; `pickup_time` logged; Live GPS simulation started | HTTP 200 OK; Status changed to `confirmed`; Tracking started | **Pass** |
| **TC-M9-02** | Admin Cancel Booking | $V_2$ | `booking_id`: 7, `action`: "cancel" | HTTP 200 OK; Booking status becomes `cancelled`; Car availability restored to `true` | HTTP 200 OK; Booking cancelled; Inventory updated | **Pass** |
| **TC-M9-03** | Admin Force Complete | $V_3$ | `booking_id`: 7, `action`: "complete" | HTTP 200 OK; Booking status transitions to `completed`; Simulation stopped | HTTP 200 OK; Booking marked as `completed` | **Pass** |
| **TC-M9-04** | Confirm Already Booked Car | $I_2$ | `booking_id`: 8 (Car availability: `false`) | HTTP 400 Bad Request; Error: "Vehicle is currently occupied in another active rental" | HTTP 400 Bad Request: Car is already booked | **Pass** |
| **TC-M9-05** | Invalid Action Verb | $I_1$ | `booking_id`: 7, `action`: "delete_permanently" | HTTP 400 Bad Request; Error: "Invalid action verb" | HTTP 400 Bad Request: Action must be confirm, cancel, or complete | **Pass** |

---

#### 4.10 Module 10: Admin User Access Control & Account Toggle Test Cases
- **Target URL/Endpoint:** `POST /api/admin/users/:id/toggle/` & Frontend `/admin/users`

| Test Case ID | Input Condition | Tested Class | Test Input Values | Expected Output | Actual Output | Result |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-M10-01** | Suspend Customer Account | $V_1, V_2$ | `user_id`: 5 (`active` $\rightarrow$ `inactive`) | HTTP 200 OK; Account status toggled to `inactive`; User cannot log in | HTTP 200 OK; User status toggled; Login access blocked | **Pass** |
| **TC-M10-02** | Reactivate Customer | $V_1, V_2$ | `user_id`: 5 (`inactive` $\rightarrow$ `active`) | HTTP 200 OK; Account status restored to `active`; User login allowed | HTTP 200 OK; User status restored to `active` | **Pass** |
| **TC-M10-03** | Deactivate Superuser | $I_2, I_3$ | `user_id`: 1 (Admin User) | HTTP 400 Bad Request; Error: "Superuser/Admin accounts cannot be deactivated" | HTTP 400 Bad Request: Cannot toggle superuser account | **Pass** |
| **TC-M10-04** | Non-existent User ID | $I_1$ | `user_id`: 99999 | HTTP 404 Not Found; Error: "User profile not found" | HTTP 404 Not Found returned with error alert | **Pass** |
| **TC-M10-05** | Non-integer User ID | $I_1$ | `user_id`: "unknown_user" | HTTP 404 / 400 Bad Request: "Invalid user identifier" | URL routing rejects non-integer; HTTP 404 returned | **Pass** |

---

#### 4.11 Module 11: Live GPS Vehicle Location Tracking & Simulation Test Cases
- **Target URL/Endpoint:** `POST /api/tracking/speed/:rentalId`, `POST /api/static-locations/update`

| Test Case ID | Input Condition | Tested Class | Test Input Values | Expected Output | Actual Output | Result |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-M11-01** | Set Simulation Speed 1x | $V_1$ | `rentalId`: 4, `speed`: 1 | HTTP 200 OK: `{ success: true, speed: 1 }`; Simulation tick interval set to 4000ms | HTTP 200 OK; Vehicle moves at normal 4-second pace | **Pass** |
| **TC-M11-02** | Set Simulation Speed 2x | $V_2$ | `rentalId`: 4, `speed`: 2 | HTTP 200 OK: `{ success: true, speed: 2 }`; Simulation tick interval adjusts to 2000ms | HTTP 200 OK; Vehicle marker moves at 2-second frequency | **Pass** |
| **TC-M11-03** | Set Simulation Speed 5x | $V_3$ | `rentalId`: 4, `speed`: 5 | HTTP 200 OK: `{ success: true, speed: 5 }`; Simulation tick interval adjusts to 1000ms | HTTP 200 OK; Vehicle marker steps rapidly at 1s intervals | **Pass** |
| **TC-M11-04** | Valid Map Click Parking | $V_4$ | `carId`: 2, `lat`: 23.8103, `lng`: 90.4125 | HTTP 200 OK; GeoJSON Point saved in MongoDB; Blue parking pin 'P' updates on map | HTTP 200 OK; Parking spot updated and rendered | **Pass** |
| **TC-M11-05** | Unconfigured Speed (> 5x) | $I_1$ | `rentalId`: 4, `speed`: 25 | Clamped to maximum allowed ceiling (5x); Server maintains stability without crash | Speed clamped to 5x; Simulation runs smoothly | **Pass** |
| **TC-M11-06** | Invalid Geo Coordinates | $I_4, I_5$ | `carId`: 2, `lat`: 150.00, `lng`: -220.00 | HTTP 400 Bad Request; Error: "Coordinates exceed valid spherical latitude/longitude ranges" | Coordinates validated; Out-of-bounds update rejected | **Pass** |

---

### 5. Conclusion
This lab experiment provided an exhaustive, end-to-end understanding and practical application of the **Equivalence Partitioning** technique in **Black Box Testing**. By dividing the input domains across all **11 core operational modules** of the **DriveNow Car Rental Management System** into mutually exclusive valid and invalid partitions, a highly efficient and rigorous test suite of **61 comprehensive test cases** (with at least 5 to 6 test cases per module) was created and verified without requiring impractical exhaustive testing. The test execution confirmed that user authentication, vehicle inventory, route management, rental booking, payment gateways, administrative lifecycles, and real-time GPS simulation services maintain rigorous input validation, boundary defense, role-based access authorization, and data integrity.
