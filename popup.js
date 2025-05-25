document.addEventListener('DOMContentLoaded', () => {
    const showAddPromptFormBtn = document.getElementById('showAddPromptFormBtn');
    const addPromptForm = document.getElementById('addPromptForm');
    const promptNameInput = document.getElementById('promptNameInput');
    const promptTextInput = document.getElementById('promptTextInput');
    const savePromptBtn = document.getElementById('savePromptBtn');
    const cancelAddPromptBtn = document.getElementById('cancelAddPromptBtn');
    const promptsListDiv = document.getElementById('promptsList');
    const copyNotification = document.getElementById('copyNotification');

    // DOM elements for editing prompts
    const editPromptForm = document.getElementById('editPromptForm');
    const editPromptIdInput = document.getElementById('editPromptIdInput');
    const editPromptNameInput = document.getElementById('editPromptNameInput');
    const editPromptTextInput = document.getElementById('editPromptTextInput');
    const updatePromptBtn = document.getElementById('updatePromptBtn');
    const cancelEditPromptBtn = document.getElementById('cancelEditPromptBtn');

    const ACCENT_COLORS = ['#3498db', '#2ecc71', '#e74c3c', '#f1c40f', '#9b59b6', '#1abc9c'];
    let prompts = [];

    // --- UI Toggles ---
    function toggleAddForm(show) {
        if (show) {
            editPromptForm.style.display = 'none'; // Ensure edit form is hidden
            addPromptForm.style.display = 'block';
            showAddPromptFormBtn.style.display = 'none';
            promptNameInput.focus();
        } else {
            addPromptForm.style.display = 'none';
            showAddPromptFormBtn.style.display = 'block';
            promptNameInput.value = '';
            promptTextInput.value = '';
        }
    }

    showAddPromptFormBtn.addEventListener('click', () => toggleAddForm(true));
    cancelAddPromptBtn.addEventListener('click', () => toggleAddForm(false));

    // --- Storage Operations ---
    function loadPrompts() {
        chrome.storage.local.get(['prompts'], (result) => {
            prompts = result.prompts || [];
            renderPrompts();
        });
    }

    function savePromptsToStorage() {
        chrome.storage.local.set({ prompts }, () => {
            // console.log('Prompts saved');
            renderPrompts(); // Re-render after saving
        });
    }

    // --- Prompt Management ---
    savePromptBtn.addEventListener('click', () => {
        const name = promptNameInput.value.trim();
        const text = promptTextInput.value.trim();

        if (name && text) {
            // Use a simple ID for more robust deletion if order changes,
            // but for simplicity, we'll rely on array index for now.
            // A timestamp-based ID is simple and effective:
            const newPrompt = { id: Date.now().toString(), name, text };
            prompts.push(newPrompt);
            savePromptsToStorage();
            toggleAddForm(false);
        } else {
            alert('Please provide both a name and text for the prompt.');
        }
    });

    function deletePrompt(promptId) {
        prompts = prompts.filter(prompt => prompt.id !== promptId);
        savePromptsToStorage();
    }

    function copyPromptText(text) {
        navigator.clipboard.writeText(text).then(() => {
            showCopyNotification();
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy text. See console for details.');
        });
    }

    function showCopyNotification() {
        copyNotification.classList.add('show');
        setTimeout(() => {
            copyNotification.classList.remove('show');
        }, 1500);
    }

    // --- Rendering ---
    function renderPrompts() {
        promptsListDiv.innerHTML = ''; // Clear existing list

        if (prompts.length === 0) {
            promptsListDiv.innerHTML = '<p style="text-align:center; color:#7f8c8d;">No prompts saved yet. Click "+ Add Prompt" to start!</p>';
            return;
        }

        prompts.forEach((prompt, index) => {
            const promptItem = document.createElement('div');
            promptItem.classList.add('prompt-item');
            // Cycle through accent colors using CSS classes for easier management
            promptItem.classList.add(`accent-color-${index % ACCENT_COLORS.length}`);
            // Or direct style: promptItem.style.borderLeftColor = ACCENT_COLORS[index % ACCENT_COLORS.length];


            const contentDiv = document.createElement('div');
            contentDiv.classList.add('prompt-item-content');

            const nameSpan = document.createElement('span');
            nameSpan.classList.add('prompt-name');
            nameSpan.textContent = prompt.name;

            const textPreviewSpan = document.createElement('span');
            textPreviewSpan.classList.add('prompt-text-preview');
            textPreviewSpan.textContent = prompt.text.substring(0, 50) + (prompt.text.length > 50 ? '...' : ''); // Preview

            contentDiv.appendChild(nameSpan);
            contentDiv.appendChild(textPreviewSpan);

            const actionsDiv = document.createElement('div');
            actionsDiv.classList.add('prompt-actions');

            const copyIcon = document.createElement('i');
            copyIcon.classList.add('fas', 'fa-copy');
            copyIcon.title = "Copy prompt text";
            copyIcon.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering other clicks if nested
                copyPromptText(prompt.text);
            });

            const deleteIcon = document.createElement('i');
            deleteIcon.classList.add('fas', 'fa-trash');
            deleteIcon.title = "Delete prompt";
            deleteIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete "${prompt.name}"?`)) {
                    deletePrompt(prompt.id);
                }
            });

            actionsDiv.appendChild(copyIcon);
            actionsDiv.appendChild(deleteIcon);

            const editIcon = document.createElement('i');
            editIcon.classList.add('fas', 'fa-edit'); // Or 'fa-pencil-alt'
            editIcon.title = "Edit prompt";
            editIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                showEditForm(prompt.id);
            });
            actionsDiv.appendChild(editIcon);

            promptItem.appendChild(contentDiv);
            promptItem.appendChild(actionsDiv);
            promptsListDiv.appendChild(promptItem);
        });
    }

    // --- Initial Load ---
    loadPrompts();

    // --- Edit Form: Show ---
    function showEditForm(promptId) {
        const promptToEdit = prompts.find(p => p.id === promptId);
        if (promptToEdit) {
            editPromptIdInput.value = promptToEdit.id;
            editPromptNameInput.value = promptToEdit.name;
            editPromptTextInput.value = promptToEdit.text;

            addPromptForm.style.display = 'none'; // Hide add form
            promptsListDiv.style.display = 'none'; // Hide prompts list
            showAddPromptFormBtn.style.display = 'none'; // Hide 'Add Prompt' button
            editPromptForm.style.display = 'block'; // Show edit form
            editPromptNameInput.focus();
        } else {
            console.error("Prompt not found for editing:", promptId);
        }
    }

    // --- Edit Form: Hide ---
    function hideEditForm() {
        editPromptIdInput.value = '';
        editPromptNameInput.value = '';
        editPromptTextInput.value = '';

        editPromptForm.style.display = 'none'; // Hide edit form
        promptsListDiv.style.display = 'block'; // Show prompts list
        showAddPromptFormBtn.style.display = 'block'; // Show 'Add Prompt' button
        // Ensure addPromptForm is also hidden, toggleAddForm(false) handles its fields.
        if (addPromptForm.style.display === 'block') {
            toggleAddForm(false);
        }
    }

    // --- Edit Form: Event Listeners ---
    updatePromptBtn.addEventListener('click', () => {
        const id = editPromptIdInput.value;
        const name = editPromptNameInput.value.trim();
        const text = editPromptTextInput.value.trim();

        if (!name || !text) {
            alert('Please provide both a name and text for the prompt.');
            return;
        }

        const promptIndex = prompts.findIndex(p => p.id === id);
        if (promptIndex !== -1) {
            prompts[promptIndex] = { ...prompts[promptIndex], name, text };
            savePromptsToStorage();
            hideEditForm();
        } else {
            console.error('Prompt not found for update:', id);
            alert('Error: Could not find the prompt to update. Please try again.');
            hideEditForm(); // Hide form even if error occurs
        }
    });

    cancelEditPromptBtn.addEventListener('click', hideEditForm);
});