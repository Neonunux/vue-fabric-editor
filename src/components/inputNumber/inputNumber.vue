<script setup lang="ts">
// https://github.com/view-design/ViewUIPlus/blob/master/src/components/input-number/input-number.vue
// https://github.com/arco-design/arco-design-vue/blob/main/packages/web-vue/components/input-number/input-number.tsx
import { usePointerSwipe, type MaybeRefOrGetter } from '@vueuse/core';
import { isNumber, isUndefined } from 'lodash-es';
import NP from 'number-precision';

NP.enableBoundaryChecking(false);

type StepMethods = 'minus' | 'plus';

const props = withDefaults(
  defineProps<{
    autofocus?: boolean;
    /**
     * @en Convert from `formatter` to number, and use with `formatter`
     */
    parser?: (val: string) => string;
    /**
     * @en Define the display value of the input
     */
    formatter?: (val: string) => string;
    /**
     * @en Min
     */
    min?: number;
    /**
     * @en Max
     */
    max?: number;
    /**
     * @en Precision
     */
    precision?: number;
    /**
     * @en Number change step
     */
    step?: number;
    /**
     * @en Value
     */
    modelValue?: number;
    /**
     * @en Default value (uncontrolled mode)
     */
    defaultValue?: number;
    /**
     * @en Trigger event for `v-model`
     */
    modelEvent?: 'change' | 'input';
    /**
     * @en Mode (FALSE: EMBED button embedded mode, TRUE: Button left and right buttons)
     */
    controlsOutside?: boolean;
    /**
     * @en Whether to hide the button (only available in `embed` mode)
     */
    hideButton?: boolean;
    downDisabled?: boolean;
    upDisabled?: boolean;
    /**
     * @en Input size
     * @values 'small','large','default'
     * @defaultValue 'default'
     */
    size?: 'small' | 'large' | 'default';
    /**
     * @en Whether to disable
     */
    disabled?: boolean;
    /**
     * @en Readonly
     * @version 3.33.1
     */
    readonly?: boolean;
    /**
     * @en Input prompt text
     */
    placeholder?: string;
    append?: string;
    prepend?: string;
  }>(),
  {
    min: -Infinity,
    max: Infinity,
    step: 1,
    modelEvent: 'change',
    size: 'default',
    precision: 2,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | undefined): void;
  (e: 'on-change', value: number): void;
  (e: 'on-focus', value: FocusEvent): void;
  (e: 'on-blur', value: FocusEvent): void;
  (e: 'on-input', value: number | undefined, inputValue: string, ev: Event): void;
  (e: 'on-change', value: number | undefined, ev: Event): void;
}>();

const prefixCls = 'ivu-input-number';
const iconPrefixCls = 'ivu-icon';
const inputWrapClasses = ref(`${prefixCls}-input-wrap`);
const inputClasses = ref(`${prefixCls}-input`);
const handlerClasses = ref(`${prefixCls}-handler-wrap`);
const innerUpClasses = ref(
  `${prefixCls}-handler-up-inner ${iconPrefixCls} ${iconPrefixCls}-ios-arrow-up`
);
const innerDownClasses = ref(
  `${prefixCls}-handler-down-inner ${iconPrefixCls} ${iconPrefixCls}-ios-arrow-down`
);
const upClasses = ref([
  `${prefixCls}-handler`,
  `${prefixCls}-handler-up`,
  {
    [`${prefixCls}-handler-up-disabled`]: props.upDisabled,
  },
]);
const downClasses = ref([
  `${prefixCls}-handler`,
  `${prefixCls}-handler-down`,
  {
    [`${prefixCls}-handler-down-disabled`]: props.downDisabled,
  },
]);

const focused = ref(false);

const wrapClasses = computed(() => {
  return [
    `${prefixCls}`,
    {
      [`${prefixCls}-${props.size}`]: !!props.size,
      [`${prefixCls}-disabled`]: props.disabled,
      [`${prefixCls}-focused`]: focused.value,
      [`${prefixCls}-controls-outside`]: props.controlsOutside,
    },
  ];
});

const inputRef = ref<HTMLInputElement>();

const mergedPrecision = computed(() => {
  if (isNumber(props.precision)) {
    const decimal = `${props.step}`.split('.')[1];
    const stepPrecision = (decimal && decimal.length) || 0;
    return Math.max(stepPrecision, props.precision);
  }
  return undefined;
});

const getStringValue = (number: number | undefined) => {
  if (!isNumber(number)) {
    return '';
  }

  const numString = mergedPrecision.value
    ? number.toFixed(mergedPrecision.value).replace(/\.?0+$/, '')
    : String(number);
  return props.formatter?.(numString) ?? numString;
};

const _value = ref(getStringValue(props.modelValue ?? props.defaultValue));

const handleFocus = (event: FocusEvent) => {
  focused.value = true;
  emit('on-focus', event);
};

const handleBlur = (event: FocusEvent) => {
  focused.value = false;
  emit('on-blur', event);
};

const minus = (e: Event) => {
  handleStepButton(e, 'minus', true);
};
const plus = (e: Event) => {
  handleStepButton(e, 'plus', true);
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    !props.readonly && nextStep('plus', e);
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    !props.readonly && nextStep('minus', e);
  }
};

const nextStep = (method: StepMethods, event: Event) => {
  if (
    (method === 'plus' && (isMax.value || props.upDisabled)) ||
    (method === 'minus' && (isMin.value || props.downDisabled))
  ) {
    return;
  }
  let nextValue: number | undefined;
  if (isNumber(valueNumber.value)) {
    nextValue = getLegalValue(NP[method](valueNumber.value, props.step));
  } else {
    nextValue = props.min === -Infinity ? 0 : props.min;
  }
  _value.value = getStringValue(nextValue);
  updateNumberStatus(nextValue);
  emit('update:modelValue', nextValue);
  emit('on-change', nextValue, event);
};

// Step Lay Repeated timer
let repeatTimer = 0;
const SPEED = 150;
const clearRepeatTimer = () => {
  if (repeatTimer) {
    window.clearTimeout(repeatTimer);
    repeatTimer = 0;
  }
};
const clearRepeatTimerProps = {
  onMouseup: clearRepeatTimer,
  onMouseleave: clearRepeatTimer,
};

const handleStepButton = (event: Event, method: StepMethods, needRepeat = false) => {
  event.preventDefault();
  inputRef.value?.focus();
  nextStep(method, event);
  // Continuously triggers long press
  if (needRepeat) {
    repeatTimer = window.setTimeout(
      () => (event.target as HTMLElement).dispatchEvent(event),
      SPEED
    );
  }
};

const valueNumber = computed(() => {
  if (!_value.value) {
    return undefined;
  }
  const number = Number(props.parser?.(_value.value) ?? _value.value);
  return Number.isNaN(number) ? undefined : number;
});

const isMin = ref(isNumber(valueNumber.value) && valueNumber.value <= props.min);
const isMax = ref(isNumber(valueNumber.value) && valueNumber.value >= props.max);

const updateNumberStatus = (number: number | undefined) => {
  let _isMin = false;
  let _isMax = false;
  if (isNumber(number)) {
    if (number <= props.min) {
      _isMin = true;
    }
    if (number >= props.max) {
      _isMax = true;
    }
  }
  if (isMax.value !== _isMax) {
    isMax.value = _isMax;
  }
  if (isMin.value !== _isMin) {
    isMin.value = _isMin;
  }
};

const handleInput = (e: Event) => {
  let { value } = e.target as HTMLInputElement;
  value = value.trim().replace(/。/g, '.');
  value = props.parser?.(value) ?? value;
  if (isNumber(Number(value)) || /^(\.|-)$/.test(value)) {
    _value.value = props.formatter?.(value) ?? value;
    updateNumberStatus(valueNumber.value);
    if (props.modelEvent === 'input') {
      emit('update:modelValue', valueNumber.value);
    }
    emit('on-input', valueNumber.value, _value.value, e);
  }
};

const getLegalValue = (value: number | undefined): number | undefined => {
  if (isUndefined(value)) {
    return undefined;
  }
  if (isNumber(props.min) && value < props.min) {
    value = props.min;
  }
  if (isNumber(props.max) && value > props.max) {
    value = props.max;
  }
  return isNumber(mergedPrecision.value) ? NP.round(value, mergedPrecision.value) : value;
};

const handleChange = (e: Event) => {
  const finalValue = getLegalValue(valueNumber.value);
  const stringValue = getStringValue(finalValue);
  if (finalValue !== valueNumber.value || _value.value !== stringValue) {
    _value.value = stringValue;
    updateNumberStatus(finalValue);
  }
  nextTick(() => {
    if (isNumber(props.modelValue) && props.modelValue !== finalValue) {
      _value.value = getStringValue(props.modelValue);
      updateNumberStatus(props.modelValue);
    }
  });
  emit('update:modelValue', finalValue);
  emit('on-change', finalValue, e);
};

const handleExceedRange = () => {
  const finalValue = getLegalValue(valueNumber.value);
  const stringValue = getStringValue(finalValue);
  if (finalValue !== valueNumber.value || _value.value !== stringValue) {
    _value.value = stringValue;
  }
  emit('update:modelValue', finalValue);
};

// Sliding correlation
const appendLabelRef = ref<HTMLElement>();
const prependLabelRef = ref<HTMLElement>();
const useSwipe = (target: MaybeRefOrGetter<HTMLElement | null | undefined>) => {
  const startValue = ref<number>();
  const { posStart, posEnd } = usePointerSwipe(target, {
    threshold: 0,
    onSwipeStart: () => {
      startValue.value = valueNumber.value;
    },
    onSwipe: (e: PointerEvent) => {
      if (!isNumber(startValue.value)) return;
      const newValue = startValue.value + NP.round(posEnd.x - posStart.x, 0) * props.step;
      _value.value = getStringValue(newValue);
      props.modelEvent === 'input' ? handleInput(e) : handleChange(e);
    },
  });
};

// mounted
onMounted(() => {
  appendLabelRef.value && useSwipe(appendLabelRef);
  prependLabelRef.value && useSwipe(prependLabelRef);
});

// watch
watch(
  () => props.modelValue,
  (value: number | undefined) => {
    if (value !== valueNumber.value) {
      _value.value = getStringValue(value);
      updateNumberStatus(value);
    }
  }
);
watch(
  () => props.min,
  (newVal) => {
    const _isMin = isNumber(valueNumber.value) && valueNumber.value <= newVal;
    if (isMin.value !== _isMin) {
      isMin.value = _isMin;
    }

    const isExceedMinValue = isNumber(valueNumber.value) && valueNumber.value < newVal;
    if (isExceedMinValue) {
      handleExceedRange();
    }
  }
);
watch(
  () => props.max,
  (newVal) => {
    const _isMax = isNumber(valueNumber.value) && valueNumber.value >= newVal;
    if (isMax.value !== _isMax) {
      isMax.value = _isMax;
    }

    const isExceedMaxValue = isNumber(valueNumber.value) && valueNumber.value > newVal;
    if (isExceedMaxValue) {
      handleExceedRange();
    }
  }
);

// Export function
defineExpose({
  minus,
  plus,
  input: inputRef.value,
  /**
   * @en Make the input box focus
   * @public
   */
  focus: () => {
    inputRef.value?.focus();
  },
  /**
   * @en Make the input box lose focus
   * @public
   */
  blur: () => {
    inputRef.value?.blur();
  },
});
</script>

<template>
  <div :class="wrapClasses">
    <template v-if="controlsOutside">
      <div
        class="ivu-input-number-controls-outside-btn ivu-input-number-controls-outside-down"
        :class="{ 'ivu-input-number-controls-outside-btn-disabled': downDisabled }"
        @mousedown="minus"
        v-bind="clearRepeatTimerProps"
      >
        <i class="ivu-icon ivu-icon-ios-remove"></i>
      </div>
      <div
        class="ivu-input-number-controls-outside-btn ivu-input-number-controls-outside-up"
        :class="{ 'ivu-input-number-controls-outside-btn-disabled': upDisabled }"
        @mousedown="plus"
        v-bind="clearRepeatTimerProps"
      >
        <i class="ivu-icon ivu-icon-ios-add"></i>
      </div>
    </template>
    <div :class="handlerClasses" v-else-if="!hideButton">
      <a :class="upClasses" @mousedown="plus" v-bind="clearRepeatTimerProps">
        <span :class="innerUpClasses"></span>
      </a>
      <a :class="downClasses" @mousedown="minus" v-bind="clearRepeatTimerProps">
        <span :class="innerDownClasses"></span>
      </a>
    </div>
    <div :class="inputWrapClasses">
      <template v-if="$slots.prefix">
        <slot name="prefix"></slot>
      </template>
      <label ref="appendLabelRef" :class="`${inputWrapClasses}__label`" v-else-if="append">
        {{ append }}
      </label>
      <input
        ref="inputRef"
        type="text"
        autocomplete="off"
        spellcheck="false"
        role="spinbutton"
        :aria-valuemax="max"
        :aria-valuemin="min"
        :aria-valuenow="_value"
        :value="_value"
        :class="inputClasses"
        :disabled="disabled"
        :autofocus="autofocus"
        :readonly="readonly"
        :placeholder="placeholder"
        @focus="handleFocus"
        @blur="handleBlur"
        @input="handleInput"
        @change="handleChange"
        @keydown="handleKeyDown"
      />
      <template v-if="$slots.suffix">
        <slot name="suffix"></slot>
      </template>
      <label ref="prependLabelRef" :class="`${inputWrapClasses}__label`" v-else-if="prepend">
        {{ prepend }}
      </label>
    </div>
  </div>
</template>

<style scoped lang="less">
@import 'view-ui-plus/src/styles/custom.less';

@input-number-prefix-cls: ~'@{css-prefix}input-number';

.@{input-number-prefix-cls} {
  border: none;
  background: @input-group-bg;

  &-input {
    background: none;
  }

  &-handler {
    height: (@input-height-base / 2);

    &-wrap {
      background: @input-group-bg;
      border-left-color: transparent;
    }

    &-down {
      border-top: none;
    }

    &-up-inner,
    &-down-inner {
      line-height: (@input-height-base / 2);
    }
  }

  &-input-wrap {
    display: flex;
    align-items: center;

    &__label {
      flex-shrink: 0;
      padding: 0 10px;
      user-select: none;
      cursor: ew-resize;
    }
  }

  &-small {
    .@{input-number-prefix-cls}-handler {
      height: (@input-height-small / 2);

      &-up-inner,
      &-down-inner {
        line-height: (@input-height-small / 2);
      }
    }
  }

  &-large {
    .@{input-number-prefix-cls}-handler {
      height: (@input-height-large / 2);

      &-up-inner,
      &-down-inner {
        line-height: (@input-height-large / 2);
      }
    }
  }
}
</style>
