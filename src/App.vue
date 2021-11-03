<template>
  <main>
    <Widget
      :filters="filters"
      title="Crimes by date"
      chart-type="datetime"
      provider="carto"
      domain="timwis.carto.com"
      dataset="crimes_2015_to_oct_2016"
      channel="crimes"
      group-by="date_trunc('month', dispatch_date)"
      trigger-field="dispatch_date"
      order="key"
      @filter="filter"/>
    <Widget
      :filters="filters"
      title="General crime category (local)"
      chart-type="bar"
      provider="local"
      dataset="crimes_1k.csv"
      channel="crimes"
      group-by="text_general_code"
      @filter="filter"/>
    <Widget
      :filters="filters"
      title="Police district"
      chart-type="bar"
      provider="carto"
      domain="timwis.carto.com"
      dataset="crimes_2015_to_oct_2016"
      channel="crimes"
      group-by="dc_dist"
      @filter="filter"/>
    <Widget
      :filters="filters"
      title="General crime category (remote)"
      chart-type="bar"
      provider="carto"
      domain="timwis.carto.com"
      dataset="crimes_2015_to_oct_2016"
      channel="crimes"
      group-by="text_general_code"
      @filter="filter"/>
  </main>
</template>

<script>
import Vue from 'vue'
import { mapState, mapActions } from 'vuex'

import Widget from './components/Widget'

export default {
  components: {
    Widget
  },
  /* data () {
    return {
      filters: {}
    }
  }, */
  computed: {
    ...mapState(['filters'])
  },
  methods: {
    ...mapActions(['filter'])
    /* onFilter ({ channel, field, expression }) {
      this.filters[channel] = this.filters[channel] || {}

      if (expression) {
        console.log('setting filter', { channel, field, expression })
        Vue.set(this.filters, field, { field, expression })
      } else {
        Vue.delete(this.filters[channel], field)
      }
    } */
  }
}
</script>
