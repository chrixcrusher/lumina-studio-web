# LuminaStudio Web DFDs

## 1. DFD Level 0 - Context Diagram

```mermaid
flowchart LR
    User[User / Guest User]

    LS((LuminaStudio Web System))

    HF[Hugging Face API<br/>CodeFormer Model]
    DB[(MongoDB Atlas)]

    User -->|Upload image, edit image, apply filters, manage presets, request AI restore| LS
    LS -->|Preview, restored image, history metadata, presets, export/download| User

    LS -->|Validated AI restore request<br/>image + user HF token| HF
    HF -->|Restored image result| LS

    LS -->|Accounts, encrypted token, presets, history metadata| DB
    DB -->|Stored user data, presets, history metadata| LS
```

---

## 2. DFD Level 1 - Main Web Application Flow

```mermaid
flowchart TD
    User[User / Guest User]

    P1((1.0 Access Application))
    P2((2.0 Authentication & Session Management))
    P3((3.0 Browser Image Upload & Editing))
    P4((4.0 AI Face Restoration Proxy))
    P5((5.0 Preset Management))
    P6((6.0 History Metadata Management))
    P7((7.0 Export / Download))

    AccountDB[(Account Collection)]
    PresetDB[(Preset Collection)]
    HistoryDB[(History Collection)]

    HF[Hugging Face API<br/>CodeFormer]

    User -->|Open landing page / editor| P1
    P1 -->|Guest access or auth route| P2

    User -->|Register / login / logout / me| P2
    P2 -->|Create/read account, encrypted token reference| AccountDB
    AccountDB -->|Account/session data| P2
    P2 -->|JWT or guest sessionId| User

    User -->|Upload image| P3
    P3 -->|Validate type/size in browser| P3
    User -->|Manual edits, filters, crop, rotate, text overlay| P3
    P3 -->|Edited image preview| User

    User -->|AI Restore request + image + HF token option| P4
    P4 -->|Validate image, token, ownership/session| P4
    P4 -->|Proxy image using user token| HF
    HF -->|Restored image| P4
    P4 -->|Restored image response| P3

    User -->|Create/load/update/delete/import/export preset| P5
    P5 -->|Authenticated preset CRUD| PresetDB
    PresetDB -->|Preset data| P5
    P5 -->|Apply preset settings| P3

    P3 -->|Manual operation metadata| P6
    P4 -->|AI restore metadata| P6
    P6 -->|Save/read/delete metadata only| HistoryDB
    HistoryDB -->|History records| P6
    P6 -->|History metadata list| User

    P3 -->|Final edited image| P7
    P4 -->|Restored image| P7
    P7 -->|Export/download file| User
```

---

## 3. DFD Level 2 - Guest AI Face Restoration

```mermaid
flowchart TD
    Guest[Guest User]

    P1((1.1 Open Editor as Guest))
    P2((1.2 Create / Retrieve Guest Session ID))
    P3((1.3 Upload or Edit Image in Browser))
    P4((1.4 Enter Hugging Face Token))
    P5((1.5 Submit AI Restore Request))
    P6((1.6 Validate Request))
    P7((1.7 Proxy Request to Hugging Face))
    P8((1.8 Return Restored Image))
    P9((1.9 Save History Metadata))
    P10((1.10 Discard Guest Token))

    HF[Hugging Face API<br/>CodeFormer]
    HistoryDB[(History Collection)]

    Guest -->|Open app| P1
    P1 -->|Guest mode| P2
    P2 -->|Temporary sessionId| Guest

    Guest -->|Image file| P3
    P3 -->|Browser-side edited image| P5

    Guest -->|Temporary HF token| P4
    P4 -->|Token for current request only| P5

    P5 -->|Image + token + x-session-id| P6
    P6 -->|Valid image and token| P7

    P7 -->|Image + user-provided token| HF
    HF -->|Restored image| P8

    P8 -->|Restored image preview| Guest
    P8 -->|operationType, processingMode, settings, time, sessionId| P9
    P9 -->|Metadata only| HistoryDB

    P8 -->|Request completed| P10
    P10 -->|Token not stored| Guest
```

---

## 4. DFD Level 2 - Authenticated AI Face Restoration

```mermaid
flowchart TD
    User[Authenticated User]

    P1((2.1 Upload or Edit Image in Browser))
    P2((2.2 Select Token Source))
    P3((2.3 Retrieve Saved Token If Needed))
    P4((2.4 Validate AI Restore Request))
    P5((2.5 Proxy Request to Hugging Face))
    P6((2.6 Receive Restored Image))
    P7((2.7 Return Restored Image to Editor))
    P8((2.8 Save History Metadata))

    AccountDB[(Account Collection<br/>Encrypted HF Token)]
    HistoryDB[(History Collection)]
    HF[Hugging Face API<br/>CodeFormer]

    User -->|Image file / edited image| P1
    P1 -->|Prepared image| P2

    User -->|Provide token or use saved token| P2

    P2 -->|Use saved token| P3
    P3 -->|Fetch encrypted token| AccountDB
    AccountDB -->|Encrypted token| P3
    P3 -->|Decrypt token for request only| P4

    P2 -->|Use request token| P4

    P4 -->|Validate image, token, account ownership| P5
    P5 -->|Image + user HF token| HF
    HF -->|Restored image| P6

    P6 -->|Restored image| P7
    P7 -->|Display result| User

    P6 -->|operationType, cloud_ai mode, settings, time, accountId| P8
    P8 -->|Metadata only| HistoryDB
```

---

## 5. DFD Level 2 - Browser Manual Editing & Filters

```mermaid
flowchart TD
    User[User / Guest User]

    P1((3.1 Upload Image))
    P2((3.2 Validate File in Browser))
    P3((3.3 Load Image into Canvas / WebGL Workspace))
    P4((3.4 Apply Manual Adjustments))
    P5((3.5 Apply Filter Presets))
    P6((3.6 Preview Image))
    P7((3.7 Export / Download Image))
    P8((3.8 Save Optional History Metadata))

    HistoryDB[(History Collection)]

    User -->|Image file| P1
    P1 -->|Uploaded image| P2
    P2 -->|Valid image| P3

    User -->|Brightness, contrast, exposure, saturation, highlights, shadows| P4
    User -->|Crop, rotate, flip, text overlay| P4
    P3 -->|Canvas image state| P4

    User -->|Vivid, B&W, Vintage, Warm, Cool| P5
    P4 -->|Edited image state| P5

    P5 -->|Updated image state| P6
    P4 -->|Updated image state| P6

    P6 -->|Preview result| User
    User -->|Export request| P7
    P7 -->|Downloaded image file| User

    P4 -->|operation metadata| P8
    P5 -->|filter metadata| P8
    P8 -->|Metadata only, no permanent image by default| HistoryDB
```

---

## 6. DFD Level 2 - Preset Management

```mermaid
flowchart TD
    User[Authenticated User]
    Guest[Guest User]

    P1((4.1 Create / Update / Delete Preset))
    P2((4.2 Validate Preset JSON))
    P3((4.3 Save Authenticated Preset))
    P4((4.4 Load Saved Presets))
    P5((4.5 Import Preset JSON))
    P6((4.6 Export Preset JSON))
    P7((4.7 Apply Preset in Browser))

    PresetDB[(Preset Collection)]
    AccountDB[(Account Collection)]

    User -->|Create/update/delete preset| P1
    P1 -->|Preset data| P2
    P2 -->|Validate ownership| AccountDB
    P2 -->|Valid authenticated preset| P3
    P3 -->|Save/update/delete preset| PresetDB

    User -->|Request presets| P4
    P4 -->|Fetch by accountId| PresetDB
    PresetDB -->|Preset list| P4
    P4 -->|Selected preset| P7

    User -->|Import preset JSON| P5
    Guest -->|Import preset JSON for session only| P5
    P5 -->|Validate imported settings| P2
    P2 -->|Temporary preset settings| P7

    User -->|Export preset| P6
    P6 -->|Fetch owned preset| PresetDB
    P6 -->|Download preset JSON| User

    P7 -->|Apply settings client-side| User
```

---

## 7. DFD Level 2 - History Metadata Management

```mermaid
flowchart TD
    User[User / Guest User]

    P1((5.1 Capture Operation Metadata))
    P2((5.2 Identify Owner))
    P3((5.3 Validate Ownership / Session))
    P4((5.4 Save History Metadata))
    P5((5.5 Retrieve History Metadata))
    P6((5.6 Delete History Record))

    HistoryDB[(History Collection)]
    AccountDB[(Account Collection)]

    User -->|Manual edit, filter, AI restore completed| P1
    P1 -->|operationType, processingMode, settingsUsed, processingTimeMs| P2

    P2 -->|Authenticated accountId| AccountDB
    P2 -->|Guest sessionId| P3
    AccountDB -->|Valid account| P3

    P3 -->|Valid owner/session| P4
    P4 -->|Save metadata only| HistoryDB

    User -->|GET /api/v1/history| P5
    P5 -->|Query by accountId or sessionId| HistoryDB
    HistoryDB -->|History metadata| P5
    P5 -->|History list| User

    User -->|DELETE /api/v1/history/:id| P6
    P6 -->|Validate owner/session| HistoryDB
    P6 -->|Delete owned record| HistoryDB
```
