import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import MaterialIcon from '@material/react-material-icon';
import { useStores } from '../../../store';

const CodeViewer = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  border: 1px solid #ddd;
  background-color: #1e1e1e;
  color: white;
  padding: 12px;
  min-height: 65vh;
  max-height: 80vh;
  z-index: 0;
  position: relative;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
  transition: color 0.3s;

  &:hover {
    color: #aaa;
  }
`;

const LogItem = styled.div`
  padding: 8px;
`;

interface SSEEvent {
  message: string;
}

interface SSEMessage {
  id: string;
  created_at: string;
  updated_at: string;
  event: SSEEvent;
  chat_id: string;
  from: string;
  to: string;
  status: string;
}

interface APIResponse {
  success: boolean;
  message: string;
  data: {
    limit: number;
    messages: SSEMessage[];
    offset: number;
    total: number;
  };
}

interface LogsScreenViewerProps {
  chatId: string;
}

const LogsScreenViewer: React.FC<LogsScreenViewerProps> = ({ chatId }) => {
  const { main } = useStores();
  const [logs, setLogs] = useState<SSEMessage[]>([]);
  const [copied, setCopied] = useState(false);

  const fetchLogs = async () => {
    try {
      const response: APIResponse = await main.getAllSSEMessages(chatId);

      if (response.success && response.data.messages) {
        const sortedLogs = response.data.messages.sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        setLogs(sortedLogs);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [chatId, fetchLogs]);

  const copyToClipboard = () => {
    const logText = logs.map((log) => log.event.message).join('\n');
    navigator.clipboard.writeText(logText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <CodeViewer>
      <CopyButton onClick={copyToClipboard}>
        {copied ? <MaterialIcon icon="check" /> : <MaterialIcon icon="content_copy" />}
      </CopyButton>
      {logs.length > 0 ? (
        logs.map((log) => <LogItem key={log.id}>{log.event.message}</LogItem>)
      ) : (
        <LogItem>No logs available.</LogItem>
      )}
    </CodeViewer>
  );
};

export default LogsScreenViewer;
