namespace FluentUI.Blazor.Monaco.EditorPack.WasmDemo.Services;

public class PageTitleService
{
    private string _currentTitle = "FluentUI-Blazor Monaco EditorPack - WASM Demo";

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
