# VESTIRE — AI Virtual Try-On

> **See yourself in it.**

VESTIRE is a fashion-focused web application that explores how **AI-powered virtual try-on** can improve the online shopping experience.

Users can browse fashion pieces, select a garment, upload a photo or capture one using their camera, and generate a virtual try-on result using **IDM-VTON**.

The current Phase 2 implementation integrates the official IDM-VTON Hugging Face Space through the **Gradio JavaScript client**.

---

## ✨ Key Features

* 👗 **Fashion storefront** — Browse a curated set of fashion products.
* 📸 **Photo upload** — Upload a PNG, JPG/JPEG, or WEBP image.
* 📷 **Camera capture** — Capture a photo directly from the browser.
* 🤖 **AI Virtual Try-On** — Generate a try-on image using IDM-VTON.
* 🎨 **Colour Match** — Select a base colour and explore recommended colour pairings.
* 🛍️ **Shopping Bag** — Add selected products to the bag.
* ⬇️ **Result Download** — Download the generated virtual try-on image.
* 📱 **Responsive UI** — Designed to work across desktop and smaller screens.
* ⚡ **Lightweight architecture** — Built without a large frontend framework or unnecessary dependencies.

---

## 🖥️ Product Experience

VESTIRE is designed around a simple fashion-shopping journey:

```text
Discover
   ↓
Select a garment
   ↓
Upload / capture your photo
   ↓
Choose colour combinations
   ↓
Generate your look
   ↓
View AI result
   ↓
Download / Add to Bag
```

The interface follows a minimalist fashion aesthetic with a product catalogue, try-on panel, colour matching section, shopping bag, and informational sections.

---


### Homepage

```markdown
![VESTIRE Homepage](./assets/homepage.png)
```

### Virtual Try-On

```markdown
![VESTIRE Virtual Try-On](./assets/try-on.png)
```

### Generated Result

```markdown
![VESTIRE Generated Result](./assets/result.png)
```

Recommended structure:

```text
VESTIRE-Virtual-TryOn/
│
├── assets/
│   ├── homepage.png
│   ├── try-on.png
│   └── result.png
│
├── index.html
├── server.mjs
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
├── start.bat
└── README.md
```

---

# 🤖 How the Virtual Try-On Works

VESTIRE uses **IDM-VTON** for virtual garment try-on.

The browser does not communicate directly with the model. Instead, the request goes through the VESTIRE Node.js server.

```text
┌──────────────────────┐
│       User           │
│                      │
│  Photo + Garment     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│   VESTIRE Frontend   │
│      index.html      │
└──────────┬───────────┘
           │
           │ POST /api/try-on
           ▼
┌──────────────────────┐
│    Node.js Server    │
│      server.mjs      │
│                      │
│ • Validate image     │
│ • Download garment   │
│ • Create temp files  │
│ • Call Gradio API    │
└──────────┬───────────┘
           │
           │ Gradio Client
           ▼
┌──────────────────────┐
│      IDM-VTON        │
│  Hugging Face Space  │
│    yisol/IDM-VTON    │
└──────────┬───────────┘
           │
           │ Generated image
           ▼
┌──────────────────────┐
│    VESTIRE Result    │
│                      │
│ View → Download      │
└──────────────────────┘
```

---

## 🔄 Try-On Request Flow

When the user clicks **Generate Look**, the frontend sends the user's image and selected product information to:

```http
POST /api/try-on
```

The Node.js server then:

1. Parses and validates the uploaded image.
2. Supports PNG, JPG/JPEG, and WEBP formats.
3. Downloads the selected product image.
4. Creates temporary files for the inference request.
5. Connects to the IDM-VTON Hugging Face Space.
6. Sends the person image and garment image through the Gradio client.
7. Calls the `/tryon` endpoint.
8. Uses automatic masking.
9. Runs inference with 30 denoising steps.
10. Uses a deterministic seed of `42`.
11. Converts the generated result into a data URL.
12. Sends the generated image back to the frontend.
13. Removes temporary files after the request completes.

---

# ⚙️ IDM-VTON Configuration

The current server connects to:

```text
yisol/IDM-VTON
```

The try-on request currently uses:

| Setting         | Value            |
| --------------- | ---------------- |
| IDM-VTON Space  | `yisol/IDM-VTON` |
| Endpoint        | `/tryon`         |
| Auto Mask       | Enabled          |
| Auto Crop       | Disabled         |
| Denoising Steps | 30               |
| Seed            | 42               |

These values are defined directly in `server.mjs`.

The public IDM-VTON Space uses shared GPU infrastructure, so generation time can vary. If the GPU is busy or unavailable, the request may fail and can be retried later.

---

# 🎨 Colour Match

VESTIRE includes a **Colour Match** section inside the try-on experience.

Users can:

1. Select a base colour.
2. View recommended pairing colours.
3. Select a recommended colour.
4. Use the suggestions while exploring a garment.

The colour recommendations are implemented as **local frontend logic** and do not require an external AI API.

This keeps the feature fast and independent from the virtual try-on inference process.

---

# 🛠️ Tech Stack

## Frontend

* HTML5
* CSS3
* Vanilla JavaScript
* Browser camera/file APIs
* Responsive CSS

The frontend is implemented directly in `index.html`, including the page structure, styling, product interface, try-on interaction, colour matching, and client-side UI logic.

## Backend

* Node.js
* Native Node.js HTTP server
* ES Modules
* Node.js filesystem APIs
* Native `fetch`

The backend is implemented in `server.mjs`.

## AI Integration

* IDM-VTON
* Hugging Face Spaces
* `@gradio/client`

The project currently has a very small dependency footprint, with `@gradio/client` as its runtime dependency.

---

# 🏗️ Architecture

VESTIRE uses a lightweight three-layer architecture:

```text
┌──────────────────────────────────────────┐
│              Presentation                │
│                                          │
│             index.html                   │
│       HTML + CSS + JavaScript            │
└────────────────────┬─────────────────────┘
                     │
                     │ HTTP
                     ▼
┌──────────────────────────────────────────┐
│                Backend                   │
│                                          │
│             server.mjs                   │
│                                          │
│     /api/try-on + file processing        │
└────────────────────┬─────────────────────┘
                     │
                     │ Gradio API
                     ▼
┌──────────────────────────────────────────┐
│             AI Inference                 │
│                                          │
│              IDM-VTON                    │
│         Hugging Face Space               │
└──────────────────────────────────────────┘
```

### Why this architecture?

The server acts as an integration layer between the browser and IDM-VTON.

This allows VESTIRE to handle:

* Image validation
* Product image retrieval
* Temporary file creation
* AI API communication
* Generated-image processing
* Error handling
* Temporary-file cleanup

The architecture also leaves room for future additions such as authentication, persistent storage, job queues, or dedicated AI infrastructure.

---

# 🔌 Backend API

The current backend exposes one application-specific API endpoint:

```http
POST /api/try-on
```

The frontend sends information including:

```json
{
  "personImage": "data:image/...;base64,...",
  "productImage": "https://...",
  "productName": "Selected garment"
}
```

The server processes the request and returns the generated image:

```json
{
  "image": "data:image/...;base64,..."
}
```

The implementation validates the incoming image and restricts supported formats to:

```text
PNG
JPG / JPEG
WEBP
```

The server also limits request size and cleans up temporary inference files after processing.

---

# 📁 Project Structure

```text
VESTIRE-Virtual-TryOn/
│
├── index.html
│   └── Frontend UI, styling and client-side interactions
│
├── server.mjs
│   └── Node.js server and IDM-VTON integration
│
├── package.json
│   └── Project configuration and dependencies
│
├── package-lock.json
│   └── Locked dependency versions
│
├── .env.example
│   └── Example environment configuration
│
├── .gitignore
│   └── Git ignore rules
│
├── start.bat
│   └── Windows startup helper
│
└── README.md
    └── Project documentation
```

The repository currently uses a deliberately small structure with no React, Next.js, Python backend, database, or large frontend framework.

---

# 🚀 Getting Started

## Requirements

You need:

* **Node.js 18+**
* npm
* Internet connection
* A modern web browser

You do **not** need:

* OpenAI API key
* OpenAI billing
* OpenAI account for the current implementation

The current Phase 2 build uses IDM-VTON instead of OpenAI for virtual try-on.

---

## 1. Clone the Repository

```bash
git clone https://github.com/hemlatameena/VESTIRE-Virtual-TryOn.git
cd VESTIRE-Virtual-TryOn
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Start the Server

```bash
npm start
```

The `start` script runs:

```bash
node server.mjs
```

This is defined in `package.json`.

### Windows

You can also double-click:

```text
start.bat
```

## 4. Open VESTIRE

Open:

```text
http://localhost:3000
```

The Node.js server serves the application from the same local server.

---

# ⚠️ Current Limitations

VESTIRE is currently a **Phase 2 prototype**, so there are several limitations.

### AI Infrastructure

The virtual try-on relies on the public IDM-VTON Hugging Face Space.

Because it uses shared GPU infrastructure:

* Generation can take time.
* Availability can vary.
* Requests may fail when the public GPU is busy.

### Product Catalogue

The current interface uses a small set of demonstration fashion products rather than a production product database.

### Persistence

The current project does not include:

* User authentication
* Database persistence
* Server-side shopping carts
* Payment processing
* Persistent user profiles

The shopping bag is currently part of the frontend experience.

### AI Model

VESTIRE integrates IDM-VTON but does not train or fine-tune the model itself.

---

# 🚧 Future Improvements

## AI & Virtual Try-On

* Deploy IDM-VTON on dedicated GPU infrastructure.
* Reduce inference latency.
* Improve image preprocessing.
* Support additional garment categories.
* Support multiple generated variations.
* Add better handling for difficult poses and occlusions.
* Explore newer virtual try-on models.

## Product Experience

* Connect to a real product database.
* Add product search and filtering.
* Add size and variant selection.
* Add wishlist functionality.
* Add personalised recommendations.
* Add persistent shopping carts.

## Backend

* Add authentication.
* Add database persistence.
* Add request queues for AI generation.
* Add rate limiting.
* Add structured logging.
* Add monitoring.
* Add caching for frequently requested resources.

## Deployment

A future production architecture could look like:

```text
                ┌─────────────────┐
                │     Browser     │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │   Web / API     │
                │     Server      │
                └────────┬────────┘
                         │
             ┌───────────┼───────────┐
             │           │           │
             ▼           ▼           ▼
         Database    Object      AI Job
                     Storage      Queue
                                   │
                                   ▼
                             GPU Worker
                                   │
                                   ▼
                               IDM-VTON
```

This would make the application more suitable for real-world traffic and production workloads.

---

# 👩‍💻 My Contribution

This project demonstrates my work across **frontend development, backend development, and AI integration**.

My contribution includes:

* Designed and developed the VESTIRE fashion-focused interface.
* Built the product browsing experience.
* Implemented product selection and try-on interactions.
* Implemented image upload functionality.
* Implemented browser camera capture.
* Built the Colour Match experience.
* Developed the Node.js backend.
* Integrated IDM-VTON through the Gradio JavaScript client.
* Implemented the `/api/try-on` API.
* Added image validation and processing.
* Implemented temporary-file handling.
* Added generated-image processing and display.
* Implemented error handling for failed inference requests.
* Added generated-image download functionality.
* Built the shopping-bag interaction.
* Structured the application for future AI and e-commerce improvements.

### What I learned

Through VESTIRE, I worked on the complete flow of integrating an AI model into a user-facing application:

```text
User Interface
      ↓
Frontend interaction
      ↓
Backend API
      ↓
Image processing
      ↓
AI model integration
      ↓
Generated output
      ↓
User experience
```

The project helped me understand that integrating AI into a product involves much more than calling a model — the surrounding **API design, input validation, error handling, file management, UI states, and user experience** are equally important.

---

# 📚 IDM-VTON

VESTIRE uses the official IDM-VTON implementation through the public Hugging Face Space:

**IDM-VTON:**
https://huggingface.co/spaces/yisol/IDM-VTON

IDM-VTON is the virtual try-on system used by the current VESTIRE Phase 2 implementation.

The current repository connects to the Space using:

```javascript
Client.connect('yisol/IDM-VTON')
```

through `@gradio/client`.

### License

The current repository README notes that IDM-VTON's code and checkpoints are licensed under **CC BY-NC-SA 4.0**.

Review the model's licensing terms carefully before using the model commercially.

---

# 🔄 Development Workflow

For future changes to VESTIRE:

```bash
# Check changes
git status

# Run and test locally
npm start

# Stage changes
git add .

# Commit
git commit -m "Describe your change"

# Push to GitHub
git push
```

### Example commit messages

```text
feat: add colour matching
feat: improve virtual try-on flow
fix: handle invalid image uploads
fix: improve IDM-VTON error handling
ui: improve responsive layout
docs: update README
```

A simple workflow is:

```text
Make change
    ↓
Test locally
    ↓
git status
    ↓
git add .
    ↓
git commit
    ↓
git push
```

---

# 📌 Project Status

**Current Version:** `2.1.0`
**Phase:** Phase 2 — IDM-VTON

### Implemented

* [x] Fashion storefront
* [x] New arrivals section
* [x] Product selection
* [x] Virtual try-on interface
* [x] Image upload
* [x] Camera capture
* [x] IDM-VTON integration
* [x] Node.js backend
* [x] `/api/try-on` endpoint
* [x] Colour Match
* [x] Shopping bag
* [x] Generated image display
* [x] Generated image download
* [x] Responsive design
* [x] Image validation
* [x] Temporary-file cleanup
* [x] IDM-VTON error handling

### Planned

* [ ] Dedicated AI infrastructure
* [ ] Real product database
* [ ] User authentication
* [ ] Persistent shopping bag
* [ ] Product search
* [ ] Product recommendations
* [ ] Production deployment
* [ ] Automated testing
* [ ] Monitoring and analytics

---

# 💡 Why VESTIRE?

Online fashion shopping usually gives customers only a product photograph.

VESTIRE explores a different experience:

> **What if you could see yourself in the garment before deciding to buy it?**

The project combines:

**Fashion UI + Image Processing + AI Virtual Try-On + E-commerce Interaction**

into one end-to-end prototype.

The goal is not only to demonstrate an AI model, but to demonstrate how an AI capability can be integrated into a complete product experience.

---

# 👤 Author

**Hemlata Meena**

GitHub:
https://github.com/hemlatameena

---

<p align="center">

### VESTIRE

**Fashion, visualized.**

</p>
