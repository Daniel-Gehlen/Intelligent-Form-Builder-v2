interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
}

interface Form {
  id: string
  title: string
  description: string
  fields: FormField[]
  status: string
  created_at: string
  updated_at: string
}

export class FormExporter {
  private static instance: FormExporter

  static getInstance(): FormExporter {
    if (!FormExporter.instance) {
      FormExporter.instance = new FormExporter()
    }
    return FormExporter.instance
  }

  /**
   * Export form as complete HTML file
   */
  exportAsHTML(form: Form, options: HTMLExportOptions = {}): string {
    const {
      includeValidation = true,
      includeAutoFill = true,
      includeCSS = true,
      includeBootstrap = false,
      submitUrl = "",
      theme = "default",
    } = options

    const htmlTemplate = this.generateHTMLTemplate(form, {
      includeValidation,
      includeAutoFill,
      includeCSS,
      includeBootstrap,
      submitUrl,
      theme,
    })

    return htmlTemplate
  }

  /**
   * Export form as JSON
   */
  exportAsJSON(form: Form, options: JSONExportOptions = {}): string {
    const { includeMetadata = true, includeValidation = true, minify = false, version = "1.0" } = options

    const exportData: any = {
      version,
      exportedAt: new Date().toISOString(),
      form: {
        id: form.id,
        title: form.title,
        description: form.description,
        fields: form.fields.map((field) => ({
          id: field.id,
          type: field.type,
          label: field.label,
          placeholder: field.placeholder || "",
          required: field.required,
          options: field.options || [],
          validation: includeValidation ? this.getFieldValidation(field) : undefined,
        })),
      },
    }

    if (includeMetadata) {
      exportData.metadata = {
        status: form.status,
        createdAt: form.created_at,
        updatedAt: form.updated_at,
        fieldCount: form.fields.length,
        requiredFields: form.fields.filter((f) => f.required).length,
      }
    }

    return minify ? JSON.stringify(exportData) : JSON.stringify(exportData, null, 2)
  }

  /**
   * Generate complete HTML template
   */
  private generateHTMLTemplate(form: Form, options: HTMLExportOptions): string {
    const css = options.includeCSS ? this.generateCSS(options.theme) : ""
    const javascript = this.generateJavaScript(form, options)
    const formHTML = this.generateFormHTML(form)

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(form.title)}</title>
    ${options.includeBootstrap ? this.getBootstrapCSS() : ""}
    ${css ? `<style>${css}</style>` : ""}
</head>
<body>
    <div class="container">
        <div class="form-container">
            <div class="form-header">
                <h1>${this.escapeHtml(form.title)}</h1>
                ${form.description ? `<p class="form-description">${this.escapeHtml(form.description)}</p>` : ""}
            </div>
            ${formHTML}
        </div>
    </div>
    ${javascript}
</body>
</html>`
  }

  /**
   * Generate form HTML structure
   */
  private generateFormHTML(form: Form): string {
    const fieldsHTML = form.fields.map((field) => this.generateFieldHTML(field)).join("\n")

    return `<form id="exported-form" class="form" novalidate>
        ${fieldsHTML}
        <div class="form-group submit-group">
            <button type="submit" class="btn btn-primary" id="submit-btn">
                <span class="btn-text">Submit Form</span>
                <span class="btn-loading" style="display: none;">
                    <span class="spinner"></span>
                    Submitting...
                </span>
            </button>
        </div>
        <div id="form-messages" class="form-messages"></div>
    </form>`
  }

  /**
   * Generate HTML for individual field
   */
  private generateFieldHTML(field: FormField): string {
    const fieldId = `field_${field.id}`
    const isRequired = field.required
    const requiredAttr = isRequired ? "required" : ""
    const requiredLabel = isRequired ? '<span class="required">*</span>' : ""

    switch (field.type) {
      case "text":
      case "email":
      case "phone":
        return `<div class="form-group" data-field-type="${field.type}">
            <label for="${fieldId}" class="form-label">
                ${this.escapeHtml(field.label)}${requiredLabel}
            </label>
            <input 
                type="${field.type === "phone" ? "tel" : field.type}" 
                id="${fieldId}" 
                name="${field.id}"
                class="form-control" 
                placeholder="${this.escapeHtml(field.placeholder || "")}"
                ${requiredAttr}
                data-validation="${field.type}"
            >
            <div class="field-error" id="${fieldId}_error"></div>
        </div>`

      case "cep":
        return `<div class="form-group" data-field-type="cep">
            <label for="${fieldId}" class="form-label">
                ${this.escapeHtml(field.label)}${requiredLabel}
                <span class="auto-fill-indicator" id="${fieldId}_indicator"></span>
            </label>
            <input 
                type="text" 
                id="${fieldId}" 
                name="${field.id}"
                class="form-control" 
                placeholder="${this.escapeHtml(field.placeholder || "Ex: 12345-678")}"
                ${requiredAttr}
                data-validation="cep"
                maxlength="9"
            >
            <div class="field-error" id="${fieldId}_error"></div>
        </div>`

      case "cnpj":
        return `<div class="form-group" data-field-type="cnpj">
            <label for="${fieldId}" class="form-label">
                ${this.escapeHtml(field.label)}${requiredLabel}
                <span class="auto-fill-indicator" id="${fieldId}_indicator"></span>
            </label>
            <input 
                type="text" 
                id="${fieldId}" 
                name="${field.id}"
                class="form-control" 
                placeholder="${this.escapeHtml(field.placeholder || "Ex: 12.345.678/0001-90")}"
                ${requiredAttr}
                data-validation="cnpj"
                maxlength="18"
            >
            <div class="field-error" id="${fieldId}_error"></div>
        </div>`

      case "textarea":
        return `<div class="form-group" data-field-type="textarea">
            <label for="${fieldId}" class="form-label">
                ${this.escapeHtml(field.label)}${requiredLabel}
            </label>
            <textarea 
                id="${fieldId}" 
                name="${field.id}"
                class="form-control" 
                placeholder="${this.escapeHtml(field.placeholder || "")}"
                ${requiredAttr}
                rows="4"
            ></textarea>
            <div class="field-error" id="${fieldId}_error"></div>
        </div>`

      case "select":
        const selectOptions =
          field.options
            ?.map((option) => `<option value="${this.escapeHtml(option)}">${this.escapeHtml(option)}</option>`)
            .join("") || ""

        return `<div class="form-group" data-field-type="select">
            <label for="${fieldId}" class="form-label">
                ${this.escapeHtml(field.label)}${requiredLabel}
            </label>
            <select 
                id="${fieldId}" 
                name="${field.id}"
                class="form-control" 
                ${requiredAttr}
            >
                <option value="">Select an option</option>
                ${selectOptions}
            </select>
            <div class="field-error" id="${fieldId}_error"></div>
        </div>`

      case "radio":
        const radioOptions =
          field.options
            ?.map(
              (option, index) =>
                `<div class="radio-option">
                <input 
                    type="radio" 
                    id="${fieldId}_${index}" 
                    name="${field.id}"
                    value="${this.escapeHtml(option)}"
                    ${requiredAttr}
                >
                <label for="${fieldId}_${index}">${this.escapeHtml(option)}</label>
            </div>`,
            )
            .join("") || ""

        return `<div class="form-group" data-field-type="radio">
            <fieldset>
                <legend class="form-label">
                    ${this.escapeHtml(field.label)}${requiredLabel}
                </legend>
                <div class="radio-group">
                    ${radioOptions}
                </div>
            </fieldset>
            <div class="field-error" id="${fieldId}_error"></div>
        </div>`

      case "checkbox":
        return `<div class="form-group" data-field-type="checkbox">
            <div class="checkbox-wrapper">
                <input 
                    type="checkbox" 
                    id="${fieldId}" 
                    name="${field.id}"
                    value="true"
                    ${requiredAttr}
                >
                <label for="${fieldId}" class="checkbox-label">
                    ${this.escapeHtml(field.label)}${requiredLabel}
                </label>
            </div>
            <div class="field-error" id="${fieldId}_error"></div>
        </div>`

      case "date":
        return `<div class="form-group" data-field-type="date">
            <label for="${fieldId}" class="form-label">
                ${this.escapeHtml(field.label)}${requiredLabel}
            </label>
            <input 
                type="date" 
                id="${fieldId}" 
                name="${field.id}"
                class="form-control" 
                ${requiredAttr}
            >
            <div class="field-error" id="${fieldId}_error"></div>
        </div>`

      default:
        return `<!-- Unsupported field type: ${field.type} -->`
    }
  }

  /**
   * Generate CSS styles
   */
  private generateCSS(theme = "default"): string {
    const baseCSS = `
/* Form Builder Export - Base Styles */
* {
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f5f5f5;
    margin: 0;
    padding: 20px;
}

.container {
    max-width: 800px;
    margin: 0 auto;
}

.form-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 40px;
}

.form-header {
    margin-bottom: 30px;
    text-align: center;
}

.form-header h1 {
    color: #2c3e50;
    margin: 0 0 10px 0;
    font-size: 2rem;
    font-weight: 600;
}

.form-description {
    color: #666;
    font-size: 1.1rem;
    margin: 0;
}

.form {
    max-width: 100%;
}

.form-group {
    margin-bottom: 24px;
}

.form-label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #374151;
    font-size: 14px;
}

.required {
    color: #ef4444;
    margin-left: 4px;
}

.form-control {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    font-size: 16px;
    transition: border-color 0.2s, box-shadow 0.2s;
    background-color: #fff;
}

.form-control:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-control.error {
    border-color: #ef4444;
}

.form-control.success {
    border-color: #10b981;
}

textarea.form-control {
    resize: vertical;
    min-height: 100px;
}

.radio-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.radio-option {
    display: flex;
    align-items: center;
    gap: 8px;
}

.radio-option input[type="radio"] {
    margin: 0;
}

.checkbox-wrapper {
    display: flex;
    align-items: flex-start;
    gap: 8px;
}

.checkbox-wrapper input[type="checkbox"] {
    margin: 4px 0 0 0;
}

.checkbox-label {
    margin: 0;
    cursor: pointer;
}

.field-error {
    color: #ef4444;
    font-size: 14px;
    margin-top: 4px;
    min-height: 20px;
}

.submit-group {
    margin-top: 32px;
    text-align: center;
}

.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 12px 32px;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    min-width: 140px;
}

.btn-primary {
    background-color: #3b82f6;
    color: white;
}

.btn-primary:hover:not(:disabled) {
    background-color: #2563eb;
    transform: translateY(-1px);
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.btn-loading {
    display: none;
}

.spinner {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 8px;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.form-messages {
    margin-top: 20px;
    text-align: center;
}

.message {
    padding: 12px 16px;
    border-radius: 6px;
    margin-bottom: 12px;
}

.message.success {
    background-color: #d1fae5;
    color: #065f46;
    border: 1px solid #a7f3d0;
}

.message.error {
    background-color: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
}

.auto-fill-indicator {
    font-size: 12px;
    color: #6b7280;
    font-weight: normal;
}

.auto-fill-indicator.loading::after {
    content: " (Auto-filling...)";
    color: #3b82f6;
}

.auto-fill-indicator.success::after {
    content: " (Auto-filled ✓)";
    color: #10b981;
}

/* Responsive Design */
@media (max-width: 768px) {
    body {
        padding: 10px;
    }
    
    .form-container {
        padding: 20px;
    }
    
    .form-header h1 {
        font-size: 1.5rem;
    }
}
`

    const themeCSS = theme === "dark" ? this.getDarkThemeCSS() : ""

    return baseCSS + themeCSS
  }

  /**
   * Generate JavaScript functionality
   */
  private generateJavaScript(form: Form, options: HTMLExportOptions): string {
    const validationJS = options.includeValidation ? this.getValidationJS() : ""
    const autoFillJS = options.includeAutoFill ? this.getAutoFillJS() : ""
    const submitJS = this.getSubmitJS(options.submitUrl)

    return `<script>
${validationJS}
${autoFillJS}
${submitJS}

// Initialize form
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
});

function initializeForm() {
    const form = document.getElementById('exported-form');
    if (!form) return;

    // Add event listeners
    form.addEventListener('submit', handleSubmit);
    
    ${options.includeValidation ? "initializeValidation();" : ""}
    ${options.includeAutoFill ? "initializeAutoFill();" : ""}
}
</script>`
  }

  /**
   * Get validation JavaScript
   */
  private getValidationJS(): string {
    return `
// Form Validation
function initializeValidation() {
    const inputs = document.querySelectorAll('.form-control, input[type="radio"], input[type="checkbox"]');
    
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => clearFieldError(input));
    });
}

function validateField(field) {
    const fieldType = field.dataset.validation || field.type;
    const value = getFieldValue(field);
    const isRequired = field.hasAttribute('required');
    
    clearFieldError(field);
    
    if (isRequired && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    if (value) {
        switch (fieldType) {
            case 'email':
                if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value)) {
                    showFieldError(field, 'Please enter a valid email address');
                    return false;
                }
                break;
            case 'cep':
                const cleanCep = value.replace(/\\D/g, '');
                if (cleanCep.length !== 8) {
                    showFieldError(field, 'CEP must have 8 digits');
                    return false;
                }
                break;
            case 'cnpj':
                const cleanCnpj = value.replace(/\\D/g, '');
                if (cleanCnpj.length !== 14 || !validateCNPJ(cleanCnpj)) {
                    showFieldError(field, 'Please enter a valid CNPJ');
                    return false;
                }
                break;
        }
    }
    
    field.classList.add('success');
    return true;
}

function validateCNPJ(cnpj) {
    if (cnpj.length !== 14) return false;
    if (/^(\\d)\\1{13}$/.test(cnpj)) return false;
    
    let sum = 0;
    let weight = 5;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(cnpj[i]) * weight;
        weight = weight === 2 ? 9 : weight - 1;
    }
    const digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    
    sum = 0;
    weight = 6;
    for (let i = 0; i < 13; i++) {
        sum += parseInt(cnpj[i]) * weight;
        weight = weight === 2 ? 9 : weight - 1;
    }
    const digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    
    return parseInt(cnpj[12]) === digit1 && parseInt(cnpj[13]) === digit2;
}

function getFieldValue(field) {
    if (field.type === 'radio') {
        const checked = document.querySelector(\`input[name="\${field.name}"]:checked\`);
        return checked ? checked.value : '';
    }
    if (field.type === 'checkbox') {
        return field.checked ? field.value : '';
    }
    return field.value.trim();
}

function showFieldError(field, message) {
    const errorElement = document.getElementById(field.id + '_error');
    if (errorElement) {
        errorElement.textContent = message;
    }
    field.classList.add('error');
    field.classList.remove('success');
}

function clearFieldError(field) {
    const errorElement = document.getElementById(field.id + '_error');
    if (errorElement) {
        errorElement.textContent = '';
    }
    field.classList.remove('error');
}

function validateForm() {
    const fields = document.querySelectorAll('.form-control, input[type="radio"], input[type="checkbox"]');
    let isValid = true;
    
    fields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    return isValid;
}
`
  }

  /**
   * Get auto-fill JavaScript
   */
  private getAutoFillJS(): string {
    return `
// Auto-fill functionality
function initializeAutoFill() {
    const cepFields = document.querySelectorAll('input[data-validation="cep"]');
    const cnpjFields = document.querySelectorAll('input[data-validation="cnpj"]');
    
    cepFields.forEach(field => {
        field.addEventListener('input', debounce(() => handleCEPInput(field), 500));
    });
    
    cnpjFields.forEach(field => {
        field.addEventListener('input', debounce(() => handleCNPJInput(field), 500));
    });
}

function handleCEPInput(field) {
    const cep = field.value.replace(/\\D/g, '');
    if (cep.length === 8) {
        fetchCEPData(cep, field);
    }
}

function handleCNPJInput(field) {
    const cnpj = field.value.replace(/\\D/g, '');
    if (cnpj.length === 14 && validateCNPJ(cnpj)) {
        fetchCNPJData(cnpj, field);
    }
}

async function fetchCEPData(cep, field) {
    const indicator = document.getElementById(field.id + '_indicator');
    if (indicator) {
        indicator.className = 'auto-fill-indicator loading';
    }
    
    try {
        const response = await fetch(\`https://viacep.com.br/ws/\${cep}/json/\`);
        const data = await response.json();
        
        if (!data.erro) {
            autoFillAddressFields(data);
            if (indicator) {
                indicator.className = 'auto-fill-indicator success';
            }
        } else {
            if (indicator) {
                indicator.className = 'auto-fill-indicator';
            }
        }
    } catch (error) {
        console.error('Error fetching CEP data:', error);
        if (indicator) {
            indicator.className = 'auto-fill-indicator';
        }
    }
}

async function fetchCNPJData(cnpj, field) {
    const indicator = document.getElementById(field.id + '_indicator');
    if (indicator) {
        indicator.className = 'auto-fill-indicator loading';
    }
    
    try {
        const response = await fetch(\`https://www.receitaws.com.br/v1/cnpj/\${cnpj}\`);
        const data = await response.json();
        
        if (data.status === 'OK') {
            autoFillCompanyFields(data);
            if (indicator) {
                indicator.className = 'auto-fill-indicator success';
            }
        } else {
            if (indicator) {
                indicator.className = 'auto-fill-indicator';
            }
        }
    } catch (error) {
        console.error('Error fetching CNPJ data:', error);
        if (indicator) {
            indicator.className = 'auto-fill-indicator';
        }
    }
}

function autoFillAddressFields(data) {
    const fieldMappings = {
        'address': data.logradouro,
        'neighborhood': data.bairro,
        'city': data.localidade,
        'state': data.uf
    };
    
    Object.entries(fieldMappings).forEach(([fieldName, value]) => {
        const field = document.querySelector(\`[name*="\${fieldName}"], [id*="\${fieldName}"]\`);
        if (field && value) {
            field.value = value;
            field.dispatchEvent(new Event('input'));
        }
    });
}

function autoFillCompanyFields(data) {
    const fieldMappings = {
        'companyName': data.nome,
        'fantasyName': data.fantasia,
        'companyAddress': data.logradouro,
        'companyCity': data.municipio,
        'companyState': data.uf,
        'companyPhone': data.telefone
    };
    
    Object.entries(fieldMappings).forEach(([fieldName, value]) => {
        const field = document.querySelector(\`[name*="\${fieldName}"], [id*="\${fieldName}"]\`);
        if (field && value) {
            field.value = value;
            field.dispatchEvent(new Event('input'));
        }
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
`
  }

  /**
   * Get form submission JavaScript
   */
  private getSubmitJS(submitUrl: string): string {
    return `
// Form submission
async function handleSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    // Validate form if validation is enabled
    ${
      submitUrl
        ? `
    if (typeof validateForm === 'function' && !validateForm()) {
        showMessage('Please fix the errors above', 'error');
        return;
    }
    `
        : ""
    }
    
    // Show loading state
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'flex';
    
    try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        ${
          submitUrl
            ? `
        const response = await fetch('${submitUrl}', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showMessage('Form submitted successfully!', 'success');
            form.reset();
        } else {
            throw new Error('Submission failed');
        }
        `
            : `
        // Log form data (replace with actual submission logic)
        console.log('Form data:', data);
        showMessage('Form data logged to console (configure submitUrl for actual submission)', 'success');
        `
        }
        
    } catch (error) {
        console.error('Submission error:', error);
        showMessage('Failed to submit form. Please try again.', 'error');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

function showMessage(text, type) {
    const messagesContainer = document.getElementById('form-messages');
    const message = document.createElement('div');
    message.className = \`message \${type}\`;
    message.textContent = text;
    
    messagesContainer.innerHTML = '';
    messagesContainer.appendChild(message);
    
    // Auto-hide success messages
    if (type === 'success') {
        setTimeout(() => {
            message.remove();
        }, 5000);
    }
}
`
  }

  /**
   * Get field validation rules
   */
  private getFieldValidation(field: FormField): any {
    const validation: any = {
      required: field.required,
    }

    switch (field.type) {
      case "email":
        validation.pattern = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
        validation.message = "Please enter a valid email address"
        break
      case "phone":
        validation.pattern = "^(\\+55\\s?)?($$?\\d{2}$$?\\s?)?\\d{4,5}-?\\d{4}$"
        validation.message = "Please enter a valid phone number"
        break
      case "cep":
        validation.pattern = "^\\d{5}-?\\d{3}$"
        validation.message = "Please enter a valid CEP"
        validation.autoFill = true
        break
      case "cnpj":
        validation.pattern = "^\\d{2}\\.?\\d{3}\\.?\\d{3}\\/?\\d{4}-?\\d{2}$"
        validation.message = "Please enter a valid CNPJ"
        validation.autoFill = true
        break
    }

    return validation
  }

  /**
   * Get Bootstrap CSS CDN
   */
  private getBootstrapCSS(): string {
    return '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">'
  }

  /**
   * Get dark theme CSS
   */
  private getDarkThemeCSS(): string {
    return `
/* Dark Theme */
@media (prefers-color-scheme: dark) {
    body {
        background-color: #1f2937;
        color: #f9fafb;
    }
    
    .form-container {
        background: #374151;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }
    
    .form-header h1 {
        color: #f9fafb;
    }
    
    .form-description {
        color: #d1d5db;
    }
    
    .form-label {
        color: #e5e7eb;
    }
    
    .form-control {
        background-color: #4b5563;
        border-color: #6b7280;
        color: #f9fafb;
    }
    
    .form-control:focus {
        border-color: #60a5fa;
        box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
    }
}
`
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }
}

// Export options interfaces
export interface HTMLExportOptions {
  includeValidation?: boolean
  includeAutoFill?: boolean
  includeCSS?: boolean
  includeBootstrap?: boolean
  submitUrl?: string
  theme?: "default" | "dark"
}

export interface JSONExportOptions {
  includeMetadata?: boolean
  includeValidation?: boolean
  minify?: boolean
  version?: string
}
