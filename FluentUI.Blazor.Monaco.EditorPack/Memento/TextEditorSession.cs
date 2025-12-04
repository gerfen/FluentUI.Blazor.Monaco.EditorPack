namespace FluentUI.Blazor.Monaco.EditorPack.Memento;

/// <summary>
/// High-level text editor session that combines the Memento pattern components
/// for easy text editing with rollback capability.
/// </summary>
public class TextEditorSession
{
    private readonly TextOriginator originator_;
    private readonly TextHistory history_;
    private IMemento? originalState_;
    private bool hasUnsavedChanges_ = false;

    /// <summary>
    /// Gets or sets the current text content.
    /// </summary>
    public string Content
    {
        get => originator_.Content;
        set => originator_.Content = value;
    }

    /// <summary>
    /// Gets whether changes can be undone.
    /// </summary>
    public bool CanUndo => history_.CanUndo;

    /// <summary>
    /// Gets whether changes can be redone.
    /// </summary>
    public bool CanRedo => history_.CanRedo;

    /// <summary>
    /// Gets whether the content has been modified from the original.
    /// </summary>
    public bool IsModified => hasUnsavedChanges_;

    public TextEditorSession(string? initialContent = null)
    {
        originator_ = new TextOriginator { Content = initialContent ?? string.Empty };
        history_ = new TextHistory();
        BeginEdit(); // Automatically start the editing session
    }

    /// <summary>
    /// Begins editing by saving the original state.
    /// Can be called to reset the editing session to the current content.
    /// </summary>
    public void BeginEdit()
    {
        originalState_ = originator_.Save();
        history_.Clear();
        hasUnsavedChanges_ = false;
    }

    /// <summary>
    /// Saves the current state to history.
    /// </summary>
    public void SaveState()
    {
        var memento = originator_.Save();
        history_.Save(memento);
        hasUnsavedChanges_ = true; // Mark as modified when state is saved
    }

    /// <summary>
    /// Updates the modified flag by comparing current content with the original state.
    /// Should be called after content changes to ensure accurate dirty state tracking.
    /// </summary>
    public void UpdateModifiedState()
    {
        hasUnsavedChanges_ = originalState_ != null &&
                             originalState_.GetState() != Content;
    }

    /// <summary>
    /// Undoes the last change.
    /// </summary>
    /// <returns>True if undo was successful, false otherwise.</returns>
    public bool Undo()
    {
        var memento = history_.Undo();
        if (memento != null)
        {
            originator_.Restore(memento);
            // Check if we've undone all changes back to original
            UpdateModifiedState();
            return true;
        }
        return false;
    }

    /// <summary>
    /// Redoes the last undone change.
    /// </summary>
    /// <returns>True if redo was successful, false otherwise.</returns>
    public bool Redo()
    {
        var memento = history_.Redo();
        if (memento != null)
        {
            originator_.Restore(memento);
            // Check if redo brought us back to original state
            UpdateModifiedState();
            return true;
        }
        return false;
    }

    /// <summary>
    /// Cancels editing and rolls back to the original content.
    /// </summary>
    public void CancelEdit()
    {
        if (originalState_ != null)
        {
            originator_.Restore(originalState_);
            history_.Clear();
            hasUnsavedChanges_ = false;
        }
    }

    /// <summary>
    /// Commits the changes and clears the undo history.
    /// </summary>
    public void CommitEdit()
    {
        originalState_ = originator_.Save();
        history_.Clear();
        hasUnsavedChanges_ = false; // Reset modified flag after commit
    }

    /// <summary>
    /// Rolls back to the original state saved during BeginEdit.
    /// </summary>
    public void RollbackToOriginal()
    {
        if (originalState_ != null)
        {
            originator_.Restore(originalState_);
            hasUnsavedChanges_ = false;
        }
    }
}
