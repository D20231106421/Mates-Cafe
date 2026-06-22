<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>Mates Cafe</title>

        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">

        @if (file_exists(public_path('hot')))
            @vite(['resources/css/app.css', 'resources/js/app.js'])
        @else
            @php
                $manifest = json_decode(file_get_contents(public_path('build/manifest.json')), true);
                $cssFile = $manifest['resources/css/app.css']['file'] ?? null;
                $jsEntry = $manifest['resources/js/app.js'] ?? null;
                $jsCssFiles = $jsEntry['css'] ?? [];
                $scriptDirectory = trim(str_replace('\\', '/', dirname(request()->server('SCRIPT_NAME', ''))), '/');
                $assetBase = $scriptDirectory === '' ? '/build' : "/{$scriptDirectory}/build";
            @endphp

            @if ($cssFile)
                <link rel="stylesheet" href="{{ $assetBase }}/{{ $cssFile }}">
            @endif

            @foreach ($jsCssFiles as $jsCssFile)
                <link rel="stylesheet" href="{{ $assetBase }}/{{ $jsCssFile }}">
            @endforeach

            @if ($jsEntry)
                <script type="module" src="{{ $assetBase }}/{{ $jsEntry['file'] }}"></script>
            @endif
        @endif
    </head>
    <body>
        <div id="root"></div>
    </body>
</html>
