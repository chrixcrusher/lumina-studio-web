"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import InfoIcon from "@mui/icons-material/Info";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { AppHeader } from "@/shared/components/AppHeader";
import { OPERATION_TYPES, PROCESSING_MODES } from "@/shared/constants/lumina";
import type { HistoryRecord } from "../types/history";

const records: HistoryRecord[] = [
  {
    id: "hist_001",
    operationType: OPERATION_TYPES.adjust,
    processingMode: PROCESSING_MODES.browser,
    settingsUsed: { brightness: 12, contrast: 8 },
    status: "success",
    createdAt: "2026-06-08T10:10:00.000Z",
  },
  {
    id: "hist_002",
    operationType: OPERATION_TYPES.filter,
    processingMode: PROCESSING_MODES.browser,
    settingsUsed: { filter: "Vivid" },
    status: "success",
    createdAt: "2026-06-08T10:15:00.000Z",
  },
  {
    id: "hist_003",
    operationType: OPERATION_TYPES.restoreFace,
    processingMode: PROCESSING_MODES.cloudAi,
    settingsUsed: { model: "CodeFormer", tokenSource: "request" },
    processingTimeMs: 1840,
    outputFormat: "image/png",
    status: "success",
    createdAt: "2026-06-08T10:22:00.000Z",
  },
];

function summarizeSettings(settings?: Record<string, unknown>) {
  if (!settings) return "None";
  return Object.entries(settings)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(", ");
}

export function HistoryPage() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppHeader compact />
      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h3">History Metadata</Typography>
            <Typography color="text.secondary">
              MVP history records operation metadata only. It does not promise full image reloads.
            </Typography>
          </Box>

          <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <InfoIcon color="primary" />
              <Typography color="text.secondary">
                Image URLs are nullable future fields; this view intentionally avoids stored thumbnails.
              </Typography>
            </Stack>
          </Paper>

          <TableContainer component={Paper} sx={{ border: "1px solid", borderColor: "divider" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Operation</TableCell>
                  <TableCell>Processing mode</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Settings</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.operationType}</TableCell>
                    <TableCell>
                      <Chip
                        label={record.processingMode}
                        color={record.processingMode === PROCESSING_MODES.cloudAi ? "secondary" : "primary"}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={record.status}
                        color={record.status === "success" ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{summarizeSettings(record.settingsUsed)}</TableCell>
                    <TableCell>{new Date(record.createdAt).toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <Button size="small" color="error" startIcon={<DeleteIcon />}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Container>
    </Box>
  );
}
