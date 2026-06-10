# LuminaStudio User Flow Document/Diagram (UFD)
Version 1.0

## 1. Onboarding and Authentication Flow

* **Start:** User arrives at the Landing Page.
* **Decision Point:** How does the user wish to proceed?

  * **Path A (Authenticated Access):**

    1. User clicks **Sign In** or **Create Account**.
    2. System displays the authentication form.
    3. User enters credentials.
    4. System validates credentials.
    5. System retrieves the user's Account, Presets, History Metadata, and saved Hugging Face token status.
    6. System navigates the user to the Main Workspace.
  * **Path B (Guest Access):**

    1. User clicks **Enhance Now**.
    2. System creates or retrieves a temporary guest session.
    3. System navigates the user directly to the Main Workspace.

---

## 2. Image Upload Flow

* **Start:** User is in the Main Workspace.
* **Action:** User uploads an image.
* **Process:** System validates the image file.

  * **Path A (Valid Image):**

    1. System loads the image into the canvas.
    2. Editing, filtering, AI Restore, comparison, and export tools become available.
  * **Path B (Invalid Image):**

    1. System displays an error message.
    2. User selects another image.

---

## 3. Manual Editing Flow

* **Start:** Image is loaded in the editor.
* **Action:** User modifies the image using browser-side tools.

  * **Path A (Light Adjustments):**

    1. User modifies:

       * Brightness
       * Contrast
       * Exposure
       * Highlights
       * Shadows
    2. System immediately updates the preview.
  * **Path B (Color Adjustments):**

    1. User modifies:

       * Saturation
    2. System immediately updates the preview.
  * **Path C (Transform Tools):**

    1. User applies:

       * Crop
       * Rotate
       * Flip
    2. System immediately updates the preview.
  * **Path D (Text Tool):**

    1. User inserts text overlays.
    2. System immediately updates the preview.
* **Optional Action:** User clicks **Before / After**.

  1. System displays a comparison between the original upload and the current image state.

---

## 4. Filter Application Flow

* **Start:** Image is loaded in the editor.
* **Action:** User selects a filter from the Filter Gallery.
* **Decision Point:** Which filter is selected?

  * **Path A:** Vivid
  * **Path B:** Black and White
  * **Path C:** Vintage
  * **Path D:** Warm
  * **Path E:** Cool
* **Process:** System applies the selected filter using browser-side processing.
* **Result:** Updated image preview is displayed immediately.

---

## 5. AI Face Restoration Flow

* **Start:** User has an uploaded or edited image.
* **Action:** User opens the AI Restore module.
* **Decision Point:** User type.

  * **Path A (Guest User):**

    1. User enters a Hugging Face API token.
    2. User clicks **AI Restore**.
    3. Frontend sends the image, token, and session ID to the backend.
    4. Backend validates the request.
    5. Backend forwards the image to Hugging Face using the provided token.
    6. Hugging Face executes the CodeFormer model.
    7. Restored image is returned to the frontend.
    8. Frontend displays the restored image.
    9. System creates a History Metadata record linked to the session ID.
    10. Temporary token is discarded after the request.
  * **Path B (Authenticated User):**

    1. User chooses whether to use:

       * Saved Hugging Face token
       * Temporary token for the current request
    2. User clicks **AI Restore**.
    3. Frontend sends the request to the backend.
    4. Backend validates the request.
    5. Backend retrieves and decrypts the saved token if required.
    6. Backend forwards the image to Hugging Face.
    7. Hugging Face executes the CodeFormer model.
    8. Restored image is returned to the frontend.
    9. Frontend displays the restored image.
    10. System creates a History Metadata record linked to the account.

---

## 6. Hugging Face Token Management Flow

* **Start:** Authenticated user opens AI Restore settings.
* **Decision Point:** User action.

  * **Path A (Save Token):**

    1. User enters a Hugging Face API token.
    2. User enables **Save Token**.
    3. System encrypts the token.
    4. System stores the encrypted token in the Account record.
  * **Path B (Update Token):**

    1. User enters a new token.
    2. System encrypts the token.
    3. System replaces the previous token.
  * **Path C (Delete Token):**

    1. User selects **Remove Saved Token**.
    2. System deletes the encrypted token from the Account record.

---

## 7. History Management Flow

* **Start:** User opens the History section.
* **Decision Point:** User type.

  * **Path A (Authenticated User):**

    1. System retrieves History Metadata associated with the user's account.
  * **Path B (Guest User):**

    1. System retrieves History Metadata associated with the active session.
* **Action:** User selects a history item.
* **Process:** System displays the saved operation metadata and settings.
* **MVP Constraint:** History does not reload the full image state because image files are not permanently stored by default.
* **Decision Point:** Does the user apply additional edits?

  * **Path A (No):**

    1. User views the metadata only.
  * **Path B (Yes):**

    1. User returns to the current editor image or uploads a new image.
    2. User reapplies settings, modifies the image, applies filters, or requests AI restoration.
    3. System creates a new History Metadata record.
    4. Original history records remain unchanged.

---

## 8. Preset Management Flow

* **Start:** User opens the Preset Manager.
* **Decision Point:** User action.

  * **Path A (Create Preset):**

    1. User configures image settings.
    2. User clicks **Save Preset**.
    3. User enters a preset name.
    4. System stores the preset in the database.
  * **Path B (Load Preset):**

    1. User selects a preset.
    2. System retrieves preset settings.
    3. System applies settings to the image.
  * **Path C (Update Preset):**

    1. User loads an existing preset.
    2. User modifies settings.
    3. User clicks **Update Preset**.
    4. System saves the updated configuration.
  * **Path D (Delete Preset):**

    1. User selects a preset.
    2. User clicks **Delete Preset**.
    3. System removes the preset from the database.
  * **Path E (Import Preset):**

    1. User selects a preset JSON file.
    2. System validates the file.
    3. System applies the settings.
    4. Authenticated users may save the imported preset.
  * **Path F (Export Preset):**

    1. User selects a preset.
    2. User clicks **Export Preset**.
    3. System generates a JSON file.
    4. System downloads the preset file.

---

## 9. Export Image Flow

* **Start:** User finishes editing.
* **Action:** User clicks **Export**.
* **Process:** System compiles all active adjustments, filters, text overlays, and AI restoration results.
* **Process:** System generates the final image.
* **End:** Browser downloads the finalized image file.
* **Optional:** System records export metadata in History if history tracking is enabled for the current user or session.

---

## 10. Logout Flow

* **Start:** Authenticated user is in the application.
* **Action:** User clicks **Logout**.
* **Process:** System terminates the authenticated session.
* **End:** User is redirected to the Landing Page.
