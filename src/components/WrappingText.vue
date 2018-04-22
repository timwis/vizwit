<template>
  <text>
    <tspan
      v-for="(line, index) in lines"
      :key="index"
      :dy="`${index * lineHeight}em`"
      x="0">
      {{ line }}
    </tspan>
  </text>
</template>

<script>
import wrap from 'wordwrap'

export default {
  props: {
    text: {
      type: String,
      required: true
    },
    charactersPerLine: {
      type: Number,
      required: true
    },
    lineHeight: {
      type: Number,
      default: 1
    }
  },
  computed: {
    lines () {
      return wrap.hard(0, this.charactersPerLine)(this.text).split('\n')
    }
  }
}
</script>
