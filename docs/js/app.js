'use strict';

var PERSONAL_DEDUCTION = 15500000;
var DEPENDENT_DEDUCTION = 6200000;
var INSURANCE_RATE = 0.08 + 0.015 + 0.01; // 10.5%

var BRACKETS = [
  { limit: 10000000, rate: 0.05 },
  { limit: 30000000, rate: 0.10 },
  { limit: 60000000, rate: 0.20 },
  { limit: 100000000, rate: 0.30 },
  { limit: Infinity, rate: 0.35 }
];

function formatVND(value) {
  var n = Math.max(0, Math.round(value));
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseMoney(text) {
  var digits = String(text).replace(/\D/g, '');
  return digits === '' ? 0 : parseInt(digits, 10);
}

function calcProgressiveTax(taxableIncome) {
  var tax = 0;
  var prev = 0;
  for (var i = 0; i < BRACKETS.length; i++) {
    var bracket = BRACKETS[i];
    if (taxableIncome <= prev) break;
    var portion = Math.min(taxableIncome, bracket.limit) - prev;
    tax += portion * bracket.rate;
    prev = bracket.limit;
  }
  return Math.round(tax);
}

function calcBasicTax(gross, dependents) {
  var taxable = gross - PERSONAL_DEDUCTION - dependents * DEPENDENT_DEDUCTION;
  if (taxable < 0) taxable = 0;
  return calcProgressiveTax(taxable);
}

function calcAdvancedTax(gross, dependents, insuranceBase) {
  var insurance = insuranceBase * INSURANCE_RATE;
  var taxable = gross - PERSONAL_DEDUCTION - dependents * DEPENDENT_DEDUCTION - insurance;
  if (taxable < 0) taxable = 0;
  return calcProgressiveTax(taxable);
}

var MANDATORY_FIELDS = [
  { field: 'gross', label: 'Thu nhập tháng (Gross)' },
  { field: 'insurance', label: 'Mức lương đóng bảo hiểm' }
];

var ERROR_TEMPLATE = 'Trường %label% cần phải điền thông tin. Mời bạn nhập dữ liệu';

function getErrorElement(view, fieldName) {
  return view.querySelector('[data-error="' + fieldName + '"]');
}

function showError(view, fieldName, label) {
  var el = getErrorElement(view, fieldName);
  if (el) {
    el.textContent = ERROR_TEMPLATE.replace('%label%', label);
    el.hidden = false;
  }
}

function clearError(view, fieldName) {
  var el = getErrorElement(view, fieldName);
  if (el) {
    el.textContent = '';
    el.hidden = true;
  }
}

function validate(view) {
  var valid = true;
  MANDATORY_FIELDS.forEach(function (item) {
    var input = view.querySelector('[data-field="' + item.field + '"]');
    if (!input) return; // field does not exist in this view
    if (parseMoney(input.value) <= 0) {
      showError(view, item.field, item.label);
      valid = false;
    } else {
      clearError(view, item.field);
    }
  });
  return valid;
}

function getFieldValue(view, field) {
  var input = view.querySelector('[data-field="' + field + '"]');
  return input ? parseMoney(input.value) : 0;
}

function calculate(view) {
  var gross = getFieldValue(view, 'gross');
  var dependents = getFieldValue(view, 'dependents');
  var taxInput = view.querySelector('[data-field="tax"]');
  var tax;

  if (view.querySelector('[data-field="insurance"]')) {
    tax = calcAdvancedTax(gross, dependents, getFieldValue(view, 'insurance'));
  } else {
    tax = calcBasicTax(gross, dependents);
  }

  taxInput.value = formatVND(tax);
}

function bindInput(input) {
  var max = parseInt(input.getAttribute('data-max'), 10);
  var isMoney = input.classList.contains('money');

  input.addEventListener('input', function () {
    var digits = input.value.replace(/\D/g, '');
    if (digits === '') {
      input.value = '';
    } else {
      var value = parseInt(digits, 10);
      if (!isNaN(max) && value > max) value = max;
      input.value = isMoney ? formatVND(value) : String(value);
    }
    clearError(input.closest('.view'), input.getAttribute('data-field'));
  });

  input.addEventListener('blur', function () {
    var value = parseMoney(input.value);
    if (!isNaN(max) && value > max) value = max;
    input.value = value === 0 ? '' : (isMoney ? formatVND(value) : String(value));
  });
}

function bindCalcButton(button) {
  button.addEventListener('click', function () {
    var view = button.closest('.view');
    if (validate(view)) {
      calculate(view);
    }
  });
}

function initMenu() {
  var menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(function (item) {
    item.addEventListener('click', function () {
      menuItems.forEach(function (el) { el.classList.remove('active'); });
      item.classList.add('active');

      document.querySelectorAll('.view').forEach(function (view) {
        view.classList.toggle('active', view.id === item.getAttribute('data-target'));
      });
    });
  });
}

function init() {
  initMenu();
  document.querySelectorAll('.view input[data-field]').forEach(bindInput);
  document.querySelectorAll('.btn-calc').forEach(bindCalcButton);
}

document.addEventListener('DOMContentLoaded', init);
