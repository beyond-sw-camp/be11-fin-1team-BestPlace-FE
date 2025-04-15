<template>
    <header class="header">
        <h1>header</h1>
    </header>
</template>

<script>
export default {
    name: 'HeaderComponent',
    data() {
        return {
            isLoggedIn: false
        }
    }
}
</script>

<style scoped>
.header {
    background-color: #f0f0f0;
    padding: 20px;
}
</style>