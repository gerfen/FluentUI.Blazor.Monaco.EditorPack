namespace FluentUI.Blazor.Monaco.EditorPack.Memento;

/// <summary>
/// Represents a memento that stores the state of text content.
/// </summary>
public interface IMemento
{
    /// <summary>
    /// Gets the saved state.
    /// </summary>
    string GetState();
    
    /// <summary>
    /// Gets the timestamp when the state was saved.
    /// </summary>
    DateTime Timestamp { get; }
}
