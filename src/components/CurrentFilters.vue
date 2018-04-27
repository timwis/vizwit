<template>
  <div v-if="filtersArray.length > 0">
    Current filters:
    <div
      v-for="filter in filtersArray"
      :key="filter.field">
      <span>{{ filter.field }}</span>

      <span v-if="Array.isArray(filter.expression.value)">
        <span
          v-for="(condition, index) in filter.expression.value"
          :key="index">
          {{ getOperator(condition.type) }}
          {{ condition.label || condition.value }}
        </span>
      </span>

      <span v-else>
        {{ getOperator(filter.expression.type) }}
        {{ filter.expression.label || filter.expression.value }}
      </span>

      <a
        href=""
        @click.prevent="$emit('remove', filter.field)">
        X
      </a>
    </div>
  </div>
</template>

<script>
const operators = {
  '=': 'is',
  '!=': 'is not',
  '<=': 'is less than or equal to',
  '>=': 'is greater than or equal to',
  'and': 'and',
  'or': 'or'
}

export default {
  props: {
    filters: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    filtersArray () {
      return Object.values(this.filters)
    }
  },
  methods: {
    getOperator (type) {
      return operators[type] || type
    }
  }
}
</script>
