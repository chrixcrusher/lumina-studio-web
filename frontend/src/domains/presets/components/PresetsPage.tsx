"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import SaveIcon from "@mui/icons-material/Save";
import TuneIcon from "@mui/icons-material/Tune";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Container from "@mui/material/Container";
import Grid from "@mui/material/GridLegacy";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { AppHeader } from "@/shared/components/AppHeader";

const samplePresets = [
  { name: "Portrait Lift", settings: "brightness: 8, contrast: 10, saturation: 6" },
  { name: "Landscape Clean", settings: "highlights: -8, shadows: 14, vivid filter" },
  { name: "Soft Vintage", settings: "filter: Vintage, contrast: -6, saturation: -18" },
];

export function PresetsPage() {
  const [presetName, setPresetName] = useState("");

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppHeader compact />
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h3">Saved Presets</Typography>
            <Typography color="text.secondary">
              Authenticated users can create, update, delete, import, and export browser-side settings.
            </Typography>
          </Box>

          <Paper sx={{ p: { xs: 2, md: 3 }, border: "1px solid", borderColor: "divider" }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Preset name"
                  value={presetName}
                  onChange={(event) => setPresetName(event.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ButtonGroup fullWidth variant="outlined">
                  <Button startIcon={<SaveIcon />}>Create</Button>
                  <Button startIcon={<FileUploadIcon />} color="secondary">
                    Import
                  </Button>
                  <Button startIcon={<FileDownloadIcon />} color="secondary">
                    Export
                  </Button>
                </ButtonGroup>
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={2}>
            {samplePresets.map((preset) => (
              <Grid item xs={12} md={4} key={preset.name}>
                <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", height: "100%" }}>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TuneIcon color="primary" />
                      <Typography variant="h6">{preset.name}</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {preset.settings}
                    </Typography>
                    <ButtonGroup fullWidth variant="outlined">
                      <Button startIcon={<SaveIcon />}>Update</Button>
                      <Button startIcon={<DeleteIcon />} color="error">
                        Delete
                      </Button>
                    </ButtonGroup>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}
