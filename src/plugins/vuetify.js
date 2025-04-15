// plugins/vuetify.js
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';

// 테마 저장값 확인
const savedTheme = localStorage.getItem('theme') || 'dark';
const isDark = savedTheme === 'dark';

export default createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: isDark ? 'dark' : 'light',
        themes: {
            light: {
                dark: false,
                colors: {
                    primary: '#1976D2',
                    secondary: '#424242',
                    accent: '#82B1FF',
                    error: '#FF5252',
                    info: '#2196F3',
                    success: '#4CAF50',
                    warning: '#FFC107',
                    surface: '#FFFFFF',
                    background: '#F5F5F5'
                }
            },
            dark: {
                dark: true,
                colors: {
                    primary: '#2196F3',
                    secondary: '#424242',
                    accent: '#FF4081',
                    error: '#FF5252',
                    info: '#2196F3',
                    success: '#4CAF50',
                    warning: '#FB8C00',
                    surface: '#1E1E1E',
                    background: '#121212'
                }
            }
        }
    }
});