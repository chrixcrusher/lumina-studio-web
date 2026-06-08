# Lumina Studio Flowcharts 

# 1. Overall Web App Flow

```mermaid
flowchart TD
    A[User Opens LuminaStudio Web] --> B[Landing Page]

    B --> C{User Entry}
    C -->|Login| D[Authenticate User]
    C -->|Register| E[Create Account]
    C -->|Enhance Now| F[Start Guest Session]

    D --> G[Workspace]
    E --> G
    F --> G

    G --> H[Upload Image]
    H --> I[Validate File Type and Size]

    I -->|Invalid| J[Show Upload Error]
    I -->|Valid| K[Load Image in Browser Canvas]

    K --> L{Choose Action}

    L -->|Manual Edit| M[Apply Browser-Side Adjustments]
    L -->|Filter| N[Apply Browser-Side Filter]
    L -->|Preset| O[Apply Preset Settings]
    L -->|AI Restore| P[Run Cloud AI Restore]

    M --> Q[Preview Image]
    N --> Q
    O --> Q
    P --> Q

    Q --> R{Export or Continue?}
    R -->|Continue Editing| L
    R -->|Export| S[Download Final Image]

    S --> T[Save History Metadata]
    T --> U[End]
```

---

# 2. Authentication and Guest Access Flow

```mermaid
flowchart TD
    A[Landing Page] --> B{User Choice}

    B -->|Register| C[Registration Form]
    B -->|Login| D[Login Form]
    B -->|Guest Mode| E[Create Temporary Session ID]

    C --> F[Validate Email Password Display Name]
    F -->|Invalid| C
    F -->|Valid| G[Hash Password]

    G --> H[Create Account in MongoDB]
    H --> I[Return Auth Session]

    D --> J[Validate Credentials]
    J -->|Invalid| D
    J -->|Valid| I

    I --> K[Authenticated Workspace]
    E --> L[Guest Workspace]

    K --> M[Can Save Presets]
    K --> N[Can View Account History]
    K --> O[May Save Encrypted HF Token]

    L --> P[Can Edit Images]
    L --> Q[Can Use AI With Temporary HF Token]
    L --> R[Cannot Permanently Save Presets]
```

---

# 3. Browser Editing Flow

```mermaid
flowchart TD
    A[Image Uploaded] --> B[Load Image Into Browser Canvas]

    B --> C{Editing Action}

    C -->|Brightness / Contrast / Exposure| D[Apply Light Adjustment]
    C -->|Saturation / Highlights / Shadows| E[Apply Color Adjustment]
    C -->|Crop / Rotate / Flip| F[Apply Transform]
    C -->|Text Overlay| G[Render Text Layer]
    C -->|Filter Preset| H[Apply Client-Side Filter]

    D --> I[Update Preview]
    E --> I
    F --> I
    G --> I
    H --> I

    I --> J{Save Metadata?}

    J -->|Authenticated or Guest Session| K[POST /api/v1/history]
    J -->|Skip| L[Continue Editing]

    K --> L
    L --> M[Export / Download Image]
```

---

# 4. AI Face Restoration Flow

```mermaid
flowchart TD
    A[User Clicks AI Restore] --> B[Frontend Checks Image Exists]

    B -->|No Image| C[Show Missing Image Error]
    B -->|Image Available| D{User Type}

    D -->|Guest| E[Require Hugging Face Token Input]
    D -->|Authenticated| F{Token Source}

    F -->|Request Token| G[Use Provided Token]
    F -->|Saved Token| H[Use Saved Encrypted Token]
    F -->|No Token| I[Ask User for Token]

    E --> J[Send Image + Guest Token + Session ID]
    G --> K[Send Image + Request Token]
    H --> L[Send Image + Use Saved Token]

    J --> M[POST /api/v1/ai/restore-face]
    K --> M
    L --> M

    M --> N[NestJS Backend Validates Request]
    N --> O[Validate File Type and Size]
    O --> P[Resolve Hugging Face Token]

    P --> Q[Proxy Request to Hugging Face CodeFormer]
    Q --> R{Hugging Face Response}

    R -->|Success| S[Return Restored Image to Frontend]
    R -->|Failure| T[Return Clear Error Message]

    S --> U[Display Restored Image]
    U --> V[Save History Metadata]

    T --> W[Keep Current Image State]
```

---

# 5. Hugging Face Token Flow

```mermaid
flowchart TD
    A[User Opens AI Restore Module] --> B{User Type}

    B -->|Guest| C[Enter Hugging Face Token]
    C --> D[Use Token for Current Request Only]
    D --> E[Discard Token After Request]

    B -->|Authenticated| F{Token Choice}

    F -->|Enter Temporary Token| G[Use Token for Current Request Only]
    F -->|Save Token| H[Send Token to Backend]
    F -->|Use Saved Token| I[Backend Loads Encrypted Token]

    H --> J[Encrypt Token]
    J --> K[Store in Account Record]

    I --> L[Decrypt Token During AI Request Only]

    G --> M[AI Restore Request]
    K --> M
    L --> M
```

---

# 6. Preset Management Flow

```mermaid
flowchart TD
    A[User Opens Preset Manager] --> B{User Type}

    B -->|Guest| C[Import Preset JSON]
    C --> D[Validate Preset JSON]
    D -->|Invalid| E[Show Preset Error]
    D -->|Valid| F[Apply Preset Temporarily]

    B -->|Authenticated| G{Preset Action}

    G -->|Create| H[Capture Current Settings]
    H --> I[POST /api/v1/presets]

    G -->|Load| J[GET /api/v1/presets]
    J --> K[Select Preset]
    K --> L[Apply Preset Settings]

    G -->|Update| M[PUT /api/v1/presets/:id]
    G -->|Delete| N[DELETE /api/v1/presets/:id]
    G -->|Import| O[POST /api/v1/presets/import]
    G -->|Export| P[GET /api/v1/presets/:id/export]

    I --> Q[MongoDB Preset Collection]
    M --> Q
    N --> Q
    O --> Q
```

---

# 7. History Metadata Flow

```mermaid
flowchart TD
    A[Operation Completed] --> B{Operation Type}

    B -->|Manual Edit| C[processingMode: browser]
    B -->|Filter| C
    B -->|Crop / Rotate / Flip| C
    B -->|AI Restore| D[processingMode: cloud_ai]

    C --> E[Collect Settings Used]
    D --> E

    E --> F[Calculate Processing Time]
    F --> G{User Type}

    G -->|Authenticated| H[Attach accountId]
    G -->|Guest| I[Attach sessionId]

    H --> J[Create History Metadata]
    I --> J

    J --> K[Store in MongoDB History Collection]
    K --> L[Images Not Permanently Stored by Default]
```

---

# 8. Backend Request Flow

```mermaid
flowchart TD
    A[Frontend Request] --> B[NestJS API Gateway / Controller]

    B --> C[Validate Auth Token or x-session-id]
    C --> D[Validate Request DTO]

    D -->|Invalid| E[Return 400 Bad Request]
    D -->|Valid| F{Endpoint Type}

    F -->|Auth| G[Auth Service]
    F -->|Account| H[Account Service]
    F -->|Preset| I[Preset Service]
    F -->|History| J[History Service]
    F -->|AI Restore| K[Enhancement Service]

    G --> L[Account Repository]
    H --> L
    I --> M[Preset Repository]
    J --> N[History Repository]

    K --> O[Validate Image and Token]
    O --> P[Proxy to Hugging Face API]
    P --> Q[Return Restored Image]

    L --> R[MongoDB Atlas]
    M --> R
    N --> R

    Q --> S[Save History Metadata]
    S --> N
```

---

# 9. Deployment Flow

```mermaid
flowchart LR
    A[User Browser] --> B[Next.js Frontend]

    B --> C[NestJS Backend API]

    C --> D[MongoDB Atlas]
    C --> E[Hugging Face API CodeFormer]

    F[Namecheap Domain] --> G[Cloudflare DNS/CDN]
    G --> B

    B -. deployed on .-> H[Vercel or Cloudflare Pages]
    C -. deployed on .-> I[Railway / Koyeb / Render]
```
