namespace FluentUI.Blazor.Monaco.EditorPack.Memento;

/// <summary>
/// Originator class that manages text content and creates mementos.
/// </summary>
public class TextOriginator
{
    /// <summary>
    /// Gets or sets the current text content.
    /// </summary>
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Creates a memento containing the current state.
    /// </summary>
    /// <returns>A memento with the current content state.</returns>
    public IMemento Save()
    {
        return new TextMemento(Content);
    }

    /// <summary>
    /// Restores the content from a memento.
    /// </summary>
    /// <param name="memento">The memento to restore from.</param>
    public void Restore(IMemento memento)
    {
        if (memento == null)
            throw new ArgumentNullException(nameof(memento));

        Content = memento.GetState();
    }
}
