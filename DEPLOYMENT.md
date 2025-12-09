# Deploying WASM Demo to GitHub Pages

This guide explains how the FluentUI Blazor Monaco Editor Pack WASM Demo is automatically deployed to GitHub Pages.

## 🌐 Live Demo

Once deployed, the WASM demo will be available at:
**https://gerfen.github.io/FluentUI.Blazor.Monaco.EditorPack/**

---

## 🚀 Automatic Deployment

The project uses **GitHub Actions** for automated deployment. Every push to the `master` branch automatically triggers a build and deployment.

### Workflow File

`.github/workflows/deploy-wasm.yml`

The workflow:
1. Checks out the code
2. Sets up .NET 10
3. Restores dependencies
4. Publishes the WASM app in Release mode
5. Adds `.nojekyll` file (bypasses Jekyll)
6. Uploads the `wwwroot` folder as a GitHub Pages artifact
7. Deploys to GitHub Pages

---

## ⚙️ Configuration Files

### 1. **index.html** - Base Href & SPA Routing

The `index.html` uses **automatic base href management**:

**During Local Development:**
```html
<!-- Base href is "/" for local dev (Aspire, IIS Express, dotnet run) -->
<base href="/" />
```

**During GitHub Pages Publish:**
The MSBuild target in `.csproj` **automatically replaces** the base href during publish:
```html
<!-- Automatically changed to GitHub Pages path during publish -->
<base href="/FluentUI.Blazor.Monaco.EditorPack/" />
```

**SPA redirect handler** (handles deep linking):
```html
<script type="text/javascript">
    (function(l) {
        if (l.search[1] === '/' ) {
            var decoded = l.search.slice(1).split('&').map(function(s) { 
                return s.replace(/~and~/g, '&')
            }).join('?');
            window.history.replaceState(null, null,
                l.pathname.slice(0, -1) + decoded + l.hash
            );
        }
    }(window.location))
</script>
```

**Important**: 
- ✅ You **never need to manually change** the base href!
- ✅ Local development always uses `/`
- ✅ GitHub Pages publish automatically uses `/FluentUI.Blazor.Monaco.EditorPack/`
- ✅ Works seamlessly with Aspire, IIS Express, and GitHub Pages

### 2. **404.html** - SPA Deep Linking

Handles client-side routing when users navigate directly to a route:

```html
<!-- Redirects 404s to index.html with path as query parameter -->
<script type="text/javascript">
    var pathSegmentsToKeep = 1;
    var l = window.location;
    l.replace(
        l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
        l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') + '/?/' +
        l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/').replace(/&/g, '~and~') +
        (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
        l.hash
    );
</script>
```

### 3. **.nojekyll** - Bypass Jekyll Processing

An empty file that tells GitHub Pages to skip Jekyll processing. This is **critical** because:
- Blazor WASM uses a `_framework` folder
- Jekyll ignores folders starting with `_`
- Without `.nojekyll`, your app won't load

### 4. **monaco-editor-pack.js** - Smart Path Detection

The Monaco Editor Pack loader automatically detects the correct base path by checking the `<base href>` tag:

```javascript
function getBasePath() {
    const baseElement = document.querySelector('base');
    const baseHref = baseElement ? baseElement.getAttribute('href') : '/';
    
    // If base href is just '/', we're in local dev - use absolute path
    if (baseHref === '/') {
        return '/_content/FluentUI.Blazor.Monaco.EditorPack/js/';
    }
    
    // Otherwise (GitHub Pages, etc.) - use relative path to respect base href
    return '_content/FluentUI.Blazor.Monaco.EditorPack/js/';
}
```

**This ensures:**
- ✅ **Local Development** (`<base href="/" />`) → Uses absolute paths `/_content/...`
- ✅ **GitHub Pages** (`<base href="/repo-name/" />`) → Uses relative paths `_content/...`
- ✅ **Custom Domains** → Automatically adapts based on base href

### 5. **WasmDemo.csproj** - Production Optimizations & Auto Base Href

The project file includes production optimizations and **automatic base href replacement** (Release mode only):

```xml
<PropertyGroup>
  <!-- Reduces bundle size by trimming unused code -->
  <PublishTrimmed>true</PublishTrimmed>
  
  <!-- Disables collation data to reduce size -->
  <BlazorWebAssemblyPreserveCollationData>false</BlazorWebAssemblyPreserveCollationData>
  
  <!-- Enables Brotli/GZip compression -->
  <BlazorEnableCompression>true</BlazorEnableCompression>
</PropertyGroup>

<!-- Automatically updates base href during RELEASE publish for GitHub Pages -->
<!-- Only runs when: Configuration=Release AND IsPublishing=true -->
<Target Name="UpdateBaseHrefForGitHubPages" AfterTargets="Publish" Condition="'$(Configuration)' == 'Release'">
  <PropertyGroup>
    <IndexHtmlPath>$(PublishDir)wwwroot\index.html</IndexHtmlPath>
    <GitHubPagesBaseHref>/FluentUI.Blazor.Monaco.EditorPack/</GitHubPagesBaseHref>
  </PropertyGroup>
  
  <Message Text="[GitHub Pages] Updating base href in index.html for deployment..." Importance="high" />
  
  <!-- Read, replace, and write index.html -->
  <ReadLinesFromFile File="$(IndexHtmlPath)">
    <Output TaskParameter="Lines" ItemName="IndexHtmlLines" />
  </ReadLinesFromFile>
  
  <!-- Replace base href="/" with base href="/FluentUI.Blazor.Monaco.EditorPack/" -->
  <PropertyGroup>
    <UpdatedIndexHtml>@(IndexHtmlLines -> '%(Identity)', '%0D%0A')</UpdatedIndexHtml>
    <UpdatedIndexHtml>$(UpdatedIndexHtml.Replace('&lt;base href="/" /&gt;', '&lt;base href="$(GitHubPagesBaseHref)" /&gt;'))</UpdatedIndexHtml>
  </PropertyGroup>
  
  <WriteLinesToFile File="$(IndexHtmlPath)" Lines="$(UpdatedIndexHtml)" Overwrite="true" />
  
  <Message Text="[GitHub Pages] Base href updated to: $(GitHubPagesBaseHref)" Importance="high" />
</Target>
```

**This ensures:**
- ✅ Debug builds (`dotnet run`, `dotnet publish -c Debug`) → Always use `<base href="/" />`
- ✅ Release builds (`dotnet publish -c Release`) → Automatically updates to `<base href="/FluentUI.Blazor.Monaco.EditorPack/" />`
- ✅ MSBuild target only runs in **Release mode** via `Condition="'$(Configuration)' == 'Release'"`
- ✅ GitHub Pages base href is configurable via `<GitHubPagesBaseHref>` property
- ✅ Source control always has `/` in index.html

**Configuration Matrix:**

| Command | Configuration | Base Href in Output | Use Case |
|---------|--------------|-------------------|----------|
| `dotnet run` | Debug | `/` | Local development (Aspire) |
| `dotnet publish -c Debug` | Debug | `/` | Test published Debug build locally |
| `dotnet publish -c Release` | Release | `/FluentUI.Blazor.Monaco.EditorPack/` | GitHub Pages deployment |


---

## 📦 Manual Deployment (Optional)

If you prefer to deploy manually instead of using GitHub Actions:

### Step 1: Build for Production

```powershell
dotnet publish FluentUI.Blazor.Monaco.EditorPack.WasmDemo/FluentUI.Blazor.Monaco.EditorPack.WasmDemo.csproj -c Release -o ./publish/wasm
```

### Step 2: Verify .nojekyll Exists

```powershell
# Check if file exists
Test-Path "./publish/wasm/wwwroot/.nojekyll"

# If not, create it
New-Item -Path "./publish/wasm/wwwroot/.nojekyll" -ItemType File
```

### Step 3: Deploy to gh-pages Branch

```bash
# Switch to gh-pages branch (create if doesn't exist)
git checkout -b gh-pages

# Remove old files
git rm -rf .

# Copy published files
cp -r ./publish/wasm/wwwroot/* ./

# Commit and push
git add .
git commit -m "Deploy WASM demo to GitHub Pages"
git push origin gh-pages --force
```

### Step 4: Enable GitHub Pages

1. Go to **Settings** → **Pages** in your GitHub repository
2. **Source**: Deploy from a branch (or GitHub Actions)
3. **Branch**: `gh-pages` / `root` (or use GitHub Actions)
4. Click **Save**

---

## ✅ Verifying Deployment

After pushing to `master` (or manually deploying):

1. **Check GitHub Actions**:
   - Go to the **Actions** tab in your repository
   - Look for the "Deploy WASM to GitHub Pages" workflow
   - Verify it completes successfully (green checkmark)

2. **Visit the Live Site**:
   - Navigate to `https://gerfen.github.io/FluentUI.Blazor.Monaco.EditorPack/`
   - The app should load with Monaco editors working

3. **Test Deep Linking**:
   - Navigate to different routes (e.g., `/editors-demo`)
   - Refresh the page
   - Should not get 404 errors (404.html handles redirects)

4. **Check Browser Console**:
   - Open Developer Tools (F12)
   - Look for Monaco Editor initialization messages
   - Verify no 404 errors for `_framework` or `_content` files
   - Should see: `[Monaco Editor Pack] All 6 scripts loaded successfully`

---

## 🐛 Troubleshooting

### Issue: 404 on `_framework` folder

**Cause**: `.nojekyll` file is missing or not in the correct location.

**Fix**: 
- Ensure `.nojekyll` exists in `wwwroot` folder
- Verify it's included in the published output
- The GitHub Actions workflow automatically creates it

### Issue: 404 on `_content` resources (Monaco scripts, FluentUI CSS)

**Cause**: Scripts are using absolute paths (`/_content/...`) which don't respect the base href.

**Fix**:
- Ensure `monaco-editor-pack.js` uses relative paths (`_content/...`)
- This has been fixed in the current version
- All paths in `index.html` should be relative (no leading `/`)

### Issue: Blank page / App doesn't load

**Cause**: Incorrect base href in `index.html`.

**Fix**:
- If deploying to `https://gerfen.github.io/FluentUI.Blazor.Monaco.EditorPack/`:
  ```html
  <base href="/FluentUI.Blazor.Monaco.EditorPack/" />
  ```
- If deploying to a custom domain (e.g., `demo.example.com`):
  ```html
  <base href="/" />
  ```

### Issue: 404 when refreshing on a route

**Cause**: GitHub Pages doesn't natively support SPA routing.

**Fix**:
- Ensure `404.html` exists in wwwroot
- Ensure the SPA redirect script is in `index.html` `<head>`
- Both are already configured in this project

### Issue: Monaco Editor not loading

**Cause**: Static assets not resolving correctly.

**Fix**:
- Check that `_content` paths are relative (not absolute)
- Verify base href is correct
- Check browser console for specific 404 errors
- Ensure `monaco-editor-pack.js` uses relative basePath

### Issue: FluentUI CSS (reboot.css) not loading

**Cause**: Absolute path in CSS reference.

**Fix**:
- All CSS `<link>` tags in `index.html` should use relative paths:
  ```html
  <!-- Correct (relative) -->
  <link href="_content/Microsoft.FluentUI.AspNetCore.Components/css/reboot.css" rel="stylesheet" />
  
  <!-- Wrong (absolute) -->
  <link href="/_content/Microsoft.FluentUI.AspNetCore.Components/css/reboot.css" rel="stylesheet" />
  ```

---

## 📝 Local Testing with GitHub Pages Base Href

To test locally with the GitHub Pages base href:

### Option 1: Use dotnet serve with base path

```powershell
# Install dotnet-serve if not already installed
dotnet tool install --global dotnet-serve

# Serve from published output with base path
cd ./publish/wasm/wwwroot
dotnet serve --path-base /FluentUI.Blazor.Monaco.EditorPack
```

Then navigate to: `http://localhost:5000/FluentUI.Blazor.Monaco.EditorPack/`

### Option 2: Temporarily change base href for local testing

In `index.html`, temporarily change:
```html
<!-- For local testing -->
<base href="/" />
```

**Remember to change it back before committing!**

---

## 🔄 Updating the Deployment

To update the live site:

1. Make your changes to the WASM demo
2. Commit and push to `master` branch
3. GitHub Actions automatically rebuilds and redeploys
4. Changes appear live in ~2-5 minutes

```powershell
git add .
git commit -m "Update WASM demo"
git push origin master
```

---

## 🔗 Additional Resources

- [Blazor WASM Hosting Documentation](https://learn.microsoft.com/en-us/aspnet/core/blazor/host-and-deploy/webassembly)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [SPA GitHub Pages Guide](https://github.com/rafgraph/spa-github-pages)
- [GitHub Actions - Deploy Pages](https://github.com/actions/deploy-pages)

---

## 📊 Deployment Status

You can check the deployment status at:
- **Workflow runs**: https://github.com/gerfen/FluentUI.Blazor.Monaco.EditorPack/actions
- **GitHub Pages settings**: https://github.com/gerfen/FluentUI.Blazor.Monaco.EditorPack/settings/pages

---

## ✨ Production Optimizations Applied

The WASM app is optimized for production:

- ✅ **Code trimming** - Removes unused code (reduces ~30-40% size)
- ✅ **Compression** - Brotli/GZip compression enabled
- ✅ **Collation data removed** - Reduces bundle size
- ✅ **Static asset optimization** - Efficient loading
- ✅ **Monaco Editor** - Loaded from bundled static files (no CDN)
- ✅ **Relative paths** - All scripts use relative paths for base href compatibility

Expected bundle size: **~10-15 MB** (with Monaco Editor included)
