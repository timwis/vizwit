<template>
  <main>
    <Widget
      v-for="widget in widgets"
      :key="widget.title"
      v-bind="widget"
      :filters="filters"
      @filter="onFilter"/>
  </main>
</template>

<script>
import Vue from 'vue'
import Widget from './components/Widget'
import widgets from '../fixtures/config-crime-incidents.json'

export default {
  components: {
    Widget
  },
  data () {
    return {
      widgets,
      filters: {}
    }
  },
  methods: {
    onFilter (filter) {
      if (filter.expression) {
        console.log('setting filter', filter)
        Vue.set(this.filters, filter.field, filter)
      } else {
        Vue.delete(this.filters, filter.field)
      }
    }
  }
}
</script>
