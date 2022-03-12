<template>
  <div class="about">
    <div id="page">
      <h2>This is an about page</h2>
      Number: {{  number }}<br>
      <button @click="add">Add</button>
    </div>
  </div>
</template>


<script>
export default {
  name: 'About',
  computed: {
    number() {
      return this.$store.getters.getNumber
    }
  },
  methods: {
    add() {
      this.$store.dispatch('setNum')
    }
  }
}
</script>


<style scoped>
  .about{
    width: 100%;
    max-width: 1500px;
    padding: 30px;
    border: 1px solid green;
    overflow: auto;
    margin: auto;
  }
</style>
