namespace FluentUI.Blazor.Monaco.EditorPack.Memento;

/// <summary>
/// Manages the history of text mementos for undo/redo operations.
/// </summary>
public class TextHistory
{
    private readonly Stack<IMemento> history_ = new();
    private readonly Stack<IMemento> redoStack_ = new();

    /// <summary>
    /// Gets whether there are any saved states to undo.
    /// </summary>
    public bool CanUndo => history_.Count > 0;

    /// <summary>
    /// Gets whether there are any states to redo.
    /// </summary>
    public bool CanRedo => redoStack_.Count > 0;

    /// <summary>
    /// Gets the number of saved states in history.
    /// </summary>
    public int HistoryCount => history_.Count;

    /// <summary>
    /// Saves a memento to the history.
    /// </summary>
    /// <param name="memento">The memento to save.</param>
    public void Save(IMemento memento)
    {
        if (memento == null)
            throw new ArgumentNullException(nameof(memento));

        history_.Push(memento);
        redoStack_.Clear(); // Clear redo stack when new state is saved
    }

    /// <summary>
    /// Gets the most recent memento without removing it from history.
    /// </summary>
    /// <returns>The most recent memento, or null if history is empty.</returns>
    public IMemento? Peek()
    {
        return history_.Count > 0 ? history_.Peek() : null;
    }

    /// <summary>
    /// Restores the most recent memento from history.
    /// </summary>
    /// <returns>The most recent memento, or null if history is empty.</returns>
    public IMemento? Undo()
    {
        if (history_.Count == 0)
            return null;

        var memento = history_.Pop();
        redoStack_.Push(memento);
        return history_.Count > 0 ? history_.Peek() : null;
    }

    /// <summary>
    /// Restores a previously undone state.
    /// </summary>
    /// <returns>The redone memento, or null if redo stack is empty.</returns>
    public IMemento? Redo()
    {
        if (redoStack_.Count == 0)
            return null;

        var memento = redoStack_.Pop();
        history_.Push(memento);
        return memento;
    }

    /// <summary>
    /// Clears all saved history and redo states.
    /// </summary>
    public void Clear()
    {
        history_.Clear();
        redoStack_.Clear();
    }

    /// <summary>
    /// Gets the original (first saved) state if available.
    /// </summary>
    /// <returns>The original memento, or null if no history exists.</returns>
    public IMemento? GetOriginal()
    {
        return history_.Count > 0 ? history_.ToArray()[^1] : null;
    }
}
