namespace FluentUI.Blazor.Monaco.EditorPack.DemoApp.Services;

public class PageTitleService
{
    private string _currentTitle = "Monaco EditorPack Demo";
    
    public string CurrentTitle
    {
        get => _currentTitle;
        set
        {
            if (_currentTitle != value)
            {
                _currentTitle = value;
                OnTitleChanged?.Invoke();
            }
        }
    }
    
    public event Action? OnTitleChanged;
}
