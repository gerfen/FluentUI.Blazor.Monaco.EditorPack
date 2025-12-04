namespace FluentUI.Blazor.Monaco.EditorPack.Memento;

/// <summary>
/// Concrete memento implementation that stores text content state.
/// </summary>
public class TextMemento : IMemento
{
    private readonly string state_;

    public DateTime Timestamp { get; }

    public TextMemento(string state)
    {
        state_ = state ?? string.Empty;
        Timestamp = DateTime.UtcNow;
    }

    public string GetState() => state_;
}
