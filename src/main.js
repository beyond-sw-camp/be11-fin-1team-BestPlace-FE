import {createApp} from 'vue';
import App from './App.vue';
import router from './router';
import 'vuetify/styles';
import {createVuetify} from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import {aliases, mdi} from 'vuetify/iconsets/mdi';
import '@mdi/font/css/materialdesignicons.css';
import './style.css';

const chzzkTheme = {
    dark: true,
    colors: {
        background: '#15161b',
        surface: '#1e2029',
        primary: '#5ca1a8',
        accent: '#c82c35',
        'on-background': '#c4bab4',
        'on-surface': '#c4bab4',
    },
};

const vuetify = createVuetify({
    components,
    directives,
    icons: {defaultSet: 'mdi', aliases, sets: {mdi}},
    theme: {
        defaultTheme: 'chzzkTheme',
        themes: {chzzkTheme}
    }
});

createApp(App).use(router).use(vuetify).mount('#app');
