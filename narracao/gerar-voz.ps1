# Gera a narração de cada trecho com a voz Daniel (pt-BR) do próprio Windows, um .wav por fala, e salva a duração de cada uma
$ErrorActionPreference = "Stop"
$saida = Join-Path $PSScriptRoot "..\public\voz"
New-Item -ItemType Directory -Force $saida | Out-Null
$falas = Get-Content (Join-Path $PSScriptRoot "falas.json") -Raw -Encoding UTF8 | ConvertFrom-Json

# WinRT: a voz Daniel só existe no motor novo do Windows (OneCore)
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media.SpeechSynthesis, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType = WindowsRuntime]
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq "AsTask" -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Esperar($op, [Type]$tipo) { $t = $asTask.MakeGenericMethod($tipo).Invoke($null, @($op)); $t.Wait(-1) | Out-Null; $t.Result }

$sint = New-Object Windows.Media.SpeechSynthesis.SpeechSynthesizer
$voz = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices | Where-Object { $_.DisplayName -like "*Daniel*" } | Select-Object -First 1
if ($voz) { $sint.Voice = $voz }
$sint.Options.SpeakingRate = 1.08

$duracoes = @{}
foreach ($f in $falas) {
  $ssml = "<speak version='1.0' xml:lang='pt-BR'><prosody pitch='-2%'>$($f.texto)</prosody></speak>"
  $stream = Esperar ($sint.SynthesizeSsmlToStreamAsync($ssml)) ([Windows.Media.SpeechSynthesis.SpeechSynthesisStream])
  $leitor = New-Object Windows.Storage.Streams.DataReader($stream.GetInputStreamAt(0))
  $n = [uint32]$stream.Size
  Esperar ($leitor.LoadAsync($n)) ([uint32]) | Out-Null
  $bytes = New-Object byte[] $n; $leitor.ReadBytes($bytes)
  $arq = Join-Path $saida ($f.id + ".wav"); [IO.File]::WriteAllBytes($arq, $bytes)
  # duração: tamanho dos dados / bytes por segundo do cabeçalho WAV
  $bps = [BitConverter]::ToInt32($bytes, 28)
  $duracoes[$f.id] = [math]::Round(($n - 44) / $bps, 2)
}
$duracoes | ConvertTo-Json | Set-Content (Join-Path $PSScriptRoot "duracoes.json") -Encoding UTF8
"voz: " + $(if ($voz) { $voz.DisplayName } else { "padrão" })
$duracoes | ConvertTo-Json
