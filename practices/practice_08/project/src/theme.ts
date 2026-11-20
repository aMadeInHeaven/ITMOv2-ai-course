import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    primary: { main: '#196749' },
    background: { default: '#f6f7f8', paper: '#ffffff' },
    text: { primary: '#182521', secondary: '#68736f' },
    divider: '#e1e6e3',
  },
  typography: {
    fontFamily: '"Segoe UI", system-ui, sans-serif',
    h4: { fontWeight: 750, letterSpacing: '-0.04em' },
    h6: { fontWeight: 700, letterSpacing: '-0.02em' },
    subtitle1: { fontWeight: 700 },
    button: { fontWeight: 700, textTransform: 'none' },
  },
  shape: { borderRadius: 9 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&.Mui-focusVisible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 3,
          },
        }),
      },
    },
  },
})
