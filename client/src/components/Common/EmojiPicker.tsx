import React, { useState } from 'react';
import { Popover, Box, Typography, Grid, IconButton, Paper } from '@mui/material';

interface EmojiPickerProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
}

const EMOJI_CATEGORIES = {
  'Smileys & People': [
    '😀',
    '😃',
    '😄',
    '😁',
    '😆',
    '😅',
    '😂',
    '🤣',
    '😊',
    '😇',
    '🙂',
    '🙃',
    '😉',
    '😌',
    '😍',
    '🥰',
    '😘',
    '😗',
    '😙',
    '😚',
    '😋',
    '😛',
    '😝',
    '😜',
    '🤪',
    '🤨',
    '🧐',
    '🤓',
    '😎',
    '🤩',
    '🥳',
    '😏',
    '😒',
    '😞',
    '😔',
    '😟',
    '😕',
    '🙁',
    '☹️',
    '😣',
    '😖',
    '😫',
    '😩',
    '🥺',
    '😢',
    '😭',
    '😤',
    '😠',
    '😡',
    '🤬',
  ],
  'Animals & Nature': [
    '🐶',
    '🐱',
    '🐭',
    '🐹',
    '🐰',
    '🦊',
    '🐻',
    '🐼',
    '🐨',
    '🐯',
    '🦁',
    '🐮',
    '🐷',
    '🐽',
    '🐸',
    '🐵',
    '🙈',
    '🙉',
    '🙊',
    '🐒',
    '🐔',
    '🐧',
    '🐦',
    '🐤',
    '🐣',
    '🐥',
    '🦆',
    '🦅',
    '🦉',
    '🦇',
  ],
  'Food & Drink': [
    '🍎',
    '🍐',
    '🍊',
    '🍋',
    '🍌',
    '🍉',
    '🍇',
    '🍓',
    '🫐',
    '🍈',
    '🍒',
    '🍑',
    '🥭',
    '🍍',
    '🥥',
    '🥝',
    '🍅',
    '🍆',
    '🥑',
    '🥦',
    '🥬',
    '🥒',
    '🌶️',
    '🫑',
    '🌽',
    '🥕',
    '🫒',
    '🧄',
    '🧅',
    '🥔',
  ],
  Activities: [
    '⚽',
    '🏀',
    '🏈',
    '⚾',
    '🥎',
    '🎾',
    '🏐',
    '🏉',
    '🥏',
    '🎱',
    '🪀',
    '🏓',
    '🏸',
    '🏒',
    '🏑',
    '🥍',
    '🏏',
    '🪃',
    '🥅',
    '⛳',
  ],
  Objects: [
    '⌚',
    '📱',
    '📲',
    '💻',
    '⌨️',
    '🖥️',
    '🖨️',
    '🖱️',
    '🖲️',
    '🕹️',
    '🗜️',
    '💽',
    '💾',
    '💿',
    '📀',
    '📼',
    '📷',
    '📸',
    '📹',
    '🎥',
  ],
};

const EmojiPicker: React.FC<EmojiPickerProps> = ({ anchorEl, open, onClose, onEmojiSelect }) => {
  const [selectedCategory, setSelectedCategory] = useState('Smileys & People');

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
    >
      <Paper sx={{ width: 320, maxHeight: 400 }}>
        <Box sx={{ p: 1 }}>
          {/* Category Tabs */}
          <Box sx={{ mb: 1, borderBottom: 1, borderColor: 'divider' }}>
            {Object.keys(EMOJI_CATEGORIES).map((category) => (
              <IconButton
                key={category}
                size="small"
                onClick={() => setSelectedCategory(category)}
                sx={{
                  color: selectedCategory === category ? 'primary.main' : 'text.secondary',
                  fontSize: '0.75rem',
                  px: 1,
                }}
              >
                {category.split(' ')[0]}
              </IconButton>
            ))}
          </Box>

          {/* Emoji Grid */}
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            <Grid container spacing={0.5}>
              {EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES].map(
                (emoji, index) => (
                  <Grid item key={index}>
                    <IconButton
                      size="small"
                      onClick={() => handleEmojiClick(emoji)}
                      sx={{
                        fontSize: '1.2rem',
                        width: 32,
                        height: 32,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      {emoji}
                    </IconButton>
                  </Grid>
                )
              )}
            </Grid>
          </Box>
        </Box>
      </Paper>
    </Popover>
  );
};

export default EmojiPicker;
