"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import TokenIcon from "@mui/icons-material/Token";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/GridLegacy";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { AppHeader } from "@/shared/components/AppHeader";
import { accountApi } from "../services/account-api";

export function AccountSettingsPage() {
  const [displayName, setDisplayName] = useState("Guest User");
  const [email, setEmail] = useState("guest@example.com");
  const [tokenDraft, setTokenDraft] = useState("");
  const [tokenConfigured, setTokenConfigured] = useState(false);
  const [tokenActionPending, setTokenActionPending] = useState(false);
  const [message, setMessage] = useState("Plain Hugging Face tokens are never displayed after saving.");

  const handleSaveToken = async () => {
    const huggingFaceToken = tokenDraft.trim();

    if (!huggingFaceToken) {
      setMessage("Enter a Hugging Face token before saving or replacing it.");
      return;
    }

    setTokenActionPending(true);

    try {
      const status = await accountApi.saveHuggingFaceToken({ huggingFaceToken });

      setTokenConfigured(status.huggingFaceTokenConfigured);
      setTokenDraft("");
      setMessage(status.message);
    } catch (error) {
      setMessage(toTokenActionMessage(error));
    } finally {
      setTokenActionPending(false);
    }
  };

  const handleDeleteToken = async () => {
    setTokenActionPending(true);

    try {
      const status = await accountApi.deleteHuggingFaceToken();

      setTokenConfigured(status.huggingFaceTokenConfigured);
      setTokenDraft("");
      setMessage(status.message);
    } catch (error) {
      setMessage(toTokenActionMessage(error));
    } finally {
      setTokenActionPending(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppHeader compact />
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h3">Account Settings</Typography>
            <Typography color="text.secondary">
              Manage profile details and encrypted Hugging Face token status.
            </Typography>
          </Box>

          <Alert severity="info">{message}</Alert>

          <Paper sx={{ p: { xs: 2, md: 3 }, border: "1px solid", borderColor: "divider" }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" sx={{ mb: 1.5 }}>
                  Profile
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Display name"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email address"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              <Box>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} sx={{ mb: 1.5 }}>
                  <Typography variant="h6" sx={{ flex: 1 }}>
                    Hugging Face Token
                  </Typography>
                  <Chip
                    label={`huggingFaceTokenConfigured: ${tokenConfigured ? "true" : "false"}`}
                    color={tokenConfigured ? "success" : "default"}
                    variant="outlined"
                  />
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      label="New or replacement token"
                      type="password"
                      value={tokenDraft}
                      onChange={(event) => setTokenDraft(event.target.value)}
                      placeholder="hf_..."
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <TokenIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Stack direction="row" spacing={1} sx={{ height: "100%" }}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveToken}
                        disabled={tokenActionPending}
                      >
                        Save
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleDeleteToken}
                        disabled={tokenActionPending}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </Box>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}

function toTokenActionMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to update Hugging Face token status.";
}
