import { extendTheme } from '@chakra-ui/react';

export const theme = extendTheme({
  colors: {
    mint: {
      50: '#e6fff5',
      100: '#b2f5e1',
      200: '#81e6d0',
      300: '#4fd7c0',
      400: '#26c8a9',
      500: '#00b995',
      600: '#009678',
      700: '#00755d',
      800: '#005544',
      900: '#003a2e',
      950: '#001f1a',
    },
  },
  fonts: {
    heading: `'Poppins', sans-serif`,
    body: `'Inter', sans-serif`,
  },
  styles: {
    global: {
      'body': {
        bg: 'gradientToBr(from-black to-gray-900)',
        color: 'white',
        minH: '100vh',
      },
      '*::placeholder': {
        color: 'gray.400',
      },
    },
  },
});