"use client";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { ApiError } from "@/infrastructure/api/api-client";
import { APP_ROUTES } from "@/shared/constants/routes";
import { authApi } from "../services/auth-api";

interface AuthFormProps {
  mode: "login" | "register";
}

const inputSx = {
  "& .MuiOutlinedInput-root": {
    height: 57,
    bgcolor: "rgba(0,0,0,0.22)",
    borderRadius: 2,
    color: "#e4e4f2",
    "& fieldset": { borderColor: "rgba(255,255,255,0.055)" },
    "&:hover fieldset": { borderColor: "rgba(124,102,255,0.35)" },
    "&.Mui-focused fieldset": { borderColor: "rgba(124,102,255,0.6)" },
  },
  "& .MuiInputBase-input::placeholder": {
    color: "#8888b8",
    opacity: 0.9,
    fontWeight: 600,
  },
};

function FieldLabel({ children }: { children: string }) {
  return (
    <Typography
      sx={{
        color: "#a9a5ff",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        ml: 0.5,
        mb: 0.8,
      }}
    >
      {children}
    </Typography>
  );
}

export function AuthForm({ mode }: AuthFormProps) {
  const isRegister = mode === "register";
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validation = useMemo(() => {
    const errors: string[] = [];
    if (isRegister && displayName.trim().length < 2) errors.push("Display name is required.");
    if (!email.includes("@")) errors.push("Use a valid email address.");
    if (password.length < 8) errors.push("Password must be at least 8 characters.");
    return errors;
  }, [displayName, email, isRegister, password]);
  const idleSubmitLabel = isRegister ? "Create Account" : "Sign In";
  const submittingSubmitLabel = isRegister ? "Creating account..." : "Signing in...";
  const submitLabel = isSubmitting ? submittingSubmitLabel : idleSubmitLabel;
  const clearApiError = () => setApiError(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setApiError(null);

    if (validation.length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (isRegister) {
        await authApi.register({
          displayName: displayName.trim(),
          email: email.trim(),
          password,
        });
      } else {
        await authApi.login({
          email: email.trim(),
          password,
        });
      }
      router.push(APP_ROUTES.editor);
    } catch (error) {
      if (error instanceof ApiError) {
        setApiError(!isRegister && error.status === 401 ? "Invalid email or password." : error.message);
      } else {
        const fallbackMessage = isRegister
          ? "We could not create your account. Please try again."
          : "We could not sign you in. Please try again.";
        setApiError(fallbackMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#08080e",
        color: "#e4e4f2",
        display: "grid",
        placeItems: "center",
        px: 2,
        py: isRegister ? 3.5 : 8,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          width: 520,
          height: 520,
          borderRadius: "50%",
          bgcolor: "rgba(124,102,255,0.055)",
          filter: "blur(95px)",
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          width: "100%",
          maxWidth: isRegister ? 560 : 560,
          p: { xs: 3, sm: 4.8 },
          borderRadius: 2.5,
          bgcolor: "#0d0d18",
          border: "1px solid rgba(255,255,255,0.055)",
          boxShadow: "0 26px 70px rgba(0,0,0,0.36)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Stack spacing={isRegister ? 3.4 : 4}>
          <Stack alignItems="center" spacing={2.2}>
            <Button
              component={Link}
              href={APP_ROUTES.landing}
              aria-label="LuminaStudio home"
              sx={{
                minWidth: 0,
                width: 60,
                height: 60,
                borderRadius: 2.2,
                p: 0,
                overflow: "hidden",
                background: "transparent",
                boxShadow: "0 0 24px rgba(124,102,255,0.38)",
                "&:hover": {
                  background: "transparent",
                },
              }}
            >
              <Box
                component="img"
                src="/ls-logo.png"
                alt=""
                sx={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
              />
            </Button>

            <Box sx={{ textAlign: "center" }}>
              <Typography
                component="h1"
                sx={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: { xs: 31, sm: 34 },
                  fontWeight: 700,
                  color: "#f2f0ff",
                  lineHeight: 1.15,
                  mb: 1.3,
                }}
              >
                {isRegister ? "Create an account" : "Welcome back"}
              </Typography>
              <Typography sx={{ color: "#9b9bd4", fontSize: 17 }}>
                {isRegister ? "Start enhancing your photos today" : "Sign in to access your presets"}
              </Typography>
            </Box>
          </Stack>

          {submitted && validation.length > 0 && (
            <Alert severity="error" sx={{ bgcolor: "rgba(239,111,108,0.12)", color: "#ffd1d1" }}>
              {validation[0]}
            </Alert>
          )}
          {apiError && validation.length === 0 && (
            <Alert severity="error" sx={{ bgcolor: "rgba(239,111,108,0.12)", color: "#ffd1d1" }}>
              {apiError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {isRegister && (
                <Box>
                  <FieldLabel>Name</FieldLabel>
                  <TextField
                    fullWidth
                    value={displayName}
                    onChange={(event) => {
                      clearApiError();
                      setDisplayName(event.target.value);
                    }}
                    inputProps={{ "aria-label": "Display name" }}
                    placeholder="John Doe"
                    sx={inputSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutlineIcon sx={{ color: "#6868a0" }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              )}

              <Box>
                <FieldLabel>Email</FieldLabel>
                <TextField
                  fullWidth
                  type="email"
                  value={email}
                  onChange={(event) => {
                    clearApiError();
                    setEmail(event.target.value);
                  }}
                  inputProps={{ "aria-label": "Email" }}
                  placeholder="you@example.com"
                  sx={inputSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MailOutlineIcon sx={{ color: "#6868a0" }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box>
                <FieldLabel>Password</FieldLabel>
                <TextField
                  fullWidth
                  type="password"
                  value={password}
                  onChange={(event) => {
                    clearApiError();
                    setPassword(event.target.value);
                  }}
                  inputProps={{ "aria-label": "Password" }}
                  placeholder="••••••••"
                  sx={inputSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ color: "#6868a0" }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting}
                sx={{
                  mt: 2.2,
                  py: 1.75,
                  borderRadius: 2,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#ffffff",
                  background: "linear-gradient(135deg, #7c66ff, #9333ea)",
                  boxShadow: "0 0 22px rgba(124,102,255,0.26)",
                }}
              >
                {submitLabel}
              </Button>
            </Stack>
          </Box>

          <Typography sx={{ textAlign: "center", color: "#9b9bd4", fontSize: 16 }}>
            {isRegister ? "Already have an account? " : "Don't have an account? "}
            <Box
              component={Link}
              href={isRegister ? APP_ROUTES.login : APP_ROUTES.register}
              sx={{ color: "#a78bfa", fontWeight: 700 }}
            >
              {isRegister ? "Sign in" : "Sign up"}
            </Box>
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
