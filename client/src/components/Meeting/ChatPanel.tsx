import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  InputAdornment,
} from '@mui/material';
import {
  Send,
  AttachFile,
  EmojiEmotions,
  MoreVert,
  Reply,
  Delete,
  ContentCopy,
  SmartToy,
  Translate,
  Description,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { addMessage } from '../../store/slices/meetingSlice';
import { useTranslation } from 'react-i18next';
import EmojiPicker from '../Common/EmojiPicker';
import FileUpload from '../Common/FileUpload';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'file' | 'system' | 'ai_response' | 'action_item';
  timestamp: string;
  metadata?: Record<string, any>;
}

interface ChatPanelProps {
  meetingId: string;
}

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
  onReply?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onTranslate?: (messageId: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isOwn,
  onReply,
  onDelete,
  onTranslate,
}) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const { t } = useTranslation();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const getMessageIcon = () => {
    switch (message.type) {
      case 'ai_response':
        return <SmartToy fontSize="small" color="primary" />;
      case 'system':
        return null;
      case 'file':
        return <AttachFile fontSize="small" />;
      case 'action_item':
        return <Description fontSize="small" color="secondary" />;
      default:
        return null;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <ListItem
        alignItems="flex-start"
        sx={{
          flexDirection: isOwn ? 'row-reverse' : 'row',
          px: 2,
          py: 1,
        }}
      >
        <ListItemAvatar sx={{ minWidth: isOwn ? 0 : 56, ml: isOwn ? 1 : 0, mr: isOwn ? 0 : 1 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: message.type === 'ai_response' ? 'secondary.main' : 'primary.main',
            }}
          >
            {message.type === 'ai_response' ? (
              <SmartToy fontSize="small" />
            ) : (
              message.senderName.charAt(0).toUpperCase()
            )}
          </Avatar>
        </ListItemAvatar>

        <ListItemText
          sx={{
            textAlign: isOwn ? 'right' : 'left',
            ml: isOwn ? 0 : 1,
            mr: isOwn ? 1 : 0,
          }}
          primary={
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                justifyContent: isOwn ? 'flex-end' : 'flex-start',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {message.senderName}
              </Typography>
              {getMessageIcon()}
              <Typography variant="caption" color="text.secondary">
                {formatTime(message.timestamp)}
              </Typography>
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
              >
                <MoreVert fontSize="small" />
              </IconButton>
            </Box>
          }
          secondary={
            <Paper
              elevation={1}
              sx={{
                p: 1.5,
                mt: 0.5,
                maxWidth: '80%',
                bgcolor: isOwn ? 'primary.main' : 'background.paper',
                color: isOwn ? 'primary.contrastText' : 'text.primary',
                borderRadius: 2,
                borderTopLeftRadius: isOwn ? 2 : 0.5,
                borderTopRightRadius: isOwn ? 0.5 : 2,
                wordBreak: 'break-word',
                ml: isOwn ? 'auto' : 0,
                mr: isOwn ? 0 : 'auto',
              }}
            >
              <Typography variant="body2">{message.content}</Typography>

              {message.metadata?.fileUrl && (
                <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                  <Typography variant="caption">📎 {message.metadata.fileName}</Typography>
                </Box>
              )}
            </Paper>
          }
        />

        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
          <MenuItem
            onClick={() => {
              onReply?.(message);
              handleMenuClose();
            }}
          >
            <Reply sx={{ mr: 1 }} />
            Reply
          </MenuItem>
          <MenuItem
            onClick={() => {
              navigator.clipboard.writeText(message.content);
              handleMenuClose();
            }}
          >
            <ContentCopy sx={{ mr: 1 }} />
            Copy
          </MenuItem>
          <MenuItem
            onClick={() => {
              onTranslate?.(message.id);
              handleMenuClose();
            }}
          >
            <Translate sx={{ mr: 1 }} />
            Translate
          </MenuItem>
          {isOwn && (
            <MenuItem
              onClick={() => {
                onDelete?.(message.id);
                handleMenuClose();
              }}
            >
              <Delete sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          )}
        </Menu>
      </ListItem>
    </motion.div>
  );
};

const ChatPanel: React.FC<ChatPanelProps> = ({ meetingId }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { messages } = useAppSelector((state) => state.meeting);
  const { user } = useAppSelector((state) => state.auth);

  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !user) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.displayName,
      content: messageText,
      type: 'text',
      timestamp: new Date().toISOString(),
      metadata: replyingTo ? { replyTo: replyingTo.id } : undefined,
    };

    dispatch(addMessage(newMessage));
    setMessageText('');
    setReplyingTo(null);
    setIsTyping(false);
    inputRef.current?.focus();
  };

  // Handle typing indicators
  const handleTyping = (text: string) => {
    setMessageText(text);

    if (text.trim() && !isTyping) {
      setIsTyping(true);
      // In a real app, you'd emit a typing event to other users
      console.log('User started typing');
    } else if (!text.trim() && isTyping) {
      setIsTyping(false);
      console.log('User stopped typing');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleFileSelect = (files: File[]) => {
    // Handle file upload logic
    console.log('Files selected:', files);
    setShowFileUpload(false);
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const handleTranslate = (messageId: string) => {
    // Handle message translation
    console.log('Translate message:', messageId);
  };

  const handleDelete = (messageId: string) => {
    // Handle message deletion
    console.log('Delete message:', messageId);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        width: 320,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Chat Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="h6" gutterBottom>
          {t('meeting.chat')}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {messages.length} messages
        </Typography>
      </Box>

      {/* Messages List */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          bgcolor: 'background.default',
        }}
      >
        <List sx={{ py: 0 }}>
          <AnimatePresence>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isOwn={message.senderId === user?.id}
                onReply={handleReply}
                onDelete={handleDelete}
                onTranslate={handleTranslate}
              />
            ))}
          </AnimatePresence>
        </List>

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.length} people are typing...`}
            </Typography>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Reply Preview */}
      {replyingTo && (
        <Box
          sx={{
            p: 1,
            bgcolor: 'action.hover',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Replying to {replyingTo.senderName}
          </Typography>
          <Typography variant="body2" noWrap>
            {replyingTo.content}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setReplyingTo(null)}
            sx={{ position: 'absolute', right: 8 }}
          >
            ×
          </IconButton>
        </Box>
      )}

      {/* Message Input */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <TextField
          ref={inputRef}
          fullWidth
          multiline
          maxRows={3}
          value={messageText}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={t('Type a message...')}
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Emoji">
                  <IconButton size="small" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                    <EmojiEmotions />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Attach file">
                  <IconButton size="small" onClick={() => setShowFileUpload(!showFileUpload)}>
                    <AttachFile />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Send">
                  <IconButton
                    size="small"
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    color="primary"
                  >
                    <Send />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />

        {/* Emoji Picker */}
        <EmojiPicker
          anchorEl={showEmojiPicker ? inputRef.current : null}
          open={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
          onEmojiSelect={handleEmojiSelect}
        />

        {/* File Upload */}
        {showFileUpload && (
          <Box sx={{ mt: 1 }}>
            <FileUpload onFileSelect={handleFileSelect} variant="button" />
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default ChatPanel;
