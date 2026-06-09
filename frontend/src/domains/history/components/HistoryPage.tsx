"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import InfoIcon from "@mui/icons-material/Info";
import RefreshIcon from "@mui/icons-material/Refresh";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/infrastructure/api/api-client";
import { AppHeader } from "@/shared/components/AppHeader";
import { PROCESSING_MODES } from "@/shared/constants/lumina";
import { historyApi } from "../services/history-api";
import type { HistoryRecord } from "../types/history";

function summarizeSettings(settings?: Record<string, unknown>) {
  if (!settings) return "None";
  return Object.entries(settings)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(", ");
}

export function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);
  const [statusMessage, setStatusMessage] = useState("Loading history");
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);

    try {
      const history = await historyApi.list();
      setRecords(history);
      setSelectedRecord(history[0] ?? null);
      setStatusMessage(history.length ? "History loaded" : "No history metadata yet");
    } catch (error) {
      setStatusMessage(error instanceof ApiError ? error.message : "Unable to load history metadata");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const deleteRecord = async (record: HistoryRecord) => {
    try {
      await historyApi.delete(record.id);
      setRecords((currentRecords) => currentRecords.filter((current) => current.id !== record.id));
      setSelectedRecord((currentRecord) => (currentRecord?.id === record.id ? null : currentRecord));
      setStatusMessage("History metadata deleted");
    } catch (error) {
      setStatusMessage(error instanceof ApiError ? error.message : "Unable to delete history metadata");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppHeader compact />
      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between">
            <Box>
              <Typography variant="h3">History Metadata</Typography>
              <Typography color="text.secondary">
                MVP history records operation metadata only. It does not promise full image reloads.
              </Typography>
            </Box>
            <Button onClick={loadHistory} disabled={isLoading} startIcon={<RefreshIcon />} variant="outlined">
              Refresh
            </Button>
          </Stack>

          <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <InfoIcon color="primary" />
              <Typography color="text.secondary">
                Image URLs are nullable future fields; this view intentionally avoids stored thumbnails.
              </Typography>
            </Stack>
          </Paper>

          <Typography role="status" color="text.secondary">
            {statusMessage}
          </Typography>

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
                {records.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>No metadata records found for this account or guest session.</TableCell>
                  </TableRow>
                )}
                {records.map((record) => (
                  <TableRow
                    key={record.id}
                    hover
                    selected={selectedRecord?.id === record.id}
                    onClick={() => setSelectedRecord(record)}
                    sx={{ cursor: "pointer" }}
                  >
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
                      <Tooltip title="Delete history metadata">
                        <IconButton
                          aria-label={`Delete ${record.operationType} history`}
                          color="error"
                          onClick={(event) => {
                            event.stopPropagation();
                            void deleteRecord(record);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {selectedRecord && (
            <Paper sx={{ p: { xs: 2, md: 3 }, border: "1px solid", borderColor: "divider" }}>
              <Stack spacing={1.5}>
                <Typography variant="h5">Selected Metadata</Typography>
                <Typography>Operation: {selectedRecord.operationType}</Typography>
                <Typography>Processing mode: {selectedRecord.processingMode}</Typography>
                <Typography>Status: {selectedRecord.status}</Typography>
                <Typography>Settings: {summarizeSettings(selectedRecord.settingsUsed)}</Typography>
                {selectedRecord.outputFormat && <Typography>Output format: {selectedRecord.outputFormat}</Typography>}
                {selectedRecord.processingTimeMs !== undefined && (
                  <Typography>Processing time: {selectedRecord.processingTimeMs} ms</Typography>
                )}
                {selectedRecord.errorCode && <Typography>Error code: {selectedRecord.errorCode}</Typography>}
              </Stack>
            </Paper>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
