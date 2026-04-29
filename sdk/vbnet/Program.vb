Imports System
Imports System.Threading

Module Program
    Sub Main()
        Console.Title = "AuthCore VB.NET Security Console"

        Console.WriteLine("========================================")
        Console.WriteLine("     AUTHCORE VB.NET SECURITY SDK      ")
        Console.WriteLine("========================================")

        Dim baseUrl As String = "https://auth-core-sz7p.vercel.app"
        Dim appId As Integer = 2
        Dim appSecret As String = "PxMzYyvs5zzA2f39MaXlMgJfGGY4qftQ"
        Dim appVersion As String = "1.0"

        Dim sdk As New AuthCoreSDK(baseUrl, appId, appSecret, appVersion)

        Console.Write(vbCrLf & "[>] Enter Licence Key: ")
        Dim key As String = Console.ReadLine()

        If String.IsNullOrWhiteSpace(key) Then
            Console.WriteLine("[!] Key required.")
            Return
        End If

        Console.WriteLine("[*] Authenticating...")
        Dim res = sdk.Verify(key)

        If res.Success Then
            Console.WriteLine($"{vbCrLf}[+] Access Granted! Welcome, {res.Message}")
            sdk.StartHeartbeat(15000)

            Console.WriteLine($"{vbCrLf}[*] Application is running.")
            Console.WriteLine("[*] Admin broadcasts will appear in a MessageBox.")
            Console.WriteLine("[*] Press Ctrl+C to exit.")

            While True
                Thread.Sleep(1000)
            End While
        Else
            Console.WriteLine($"{vbCrLf}[-] Access Denied: {res.Message}")
            Thread.Sleep(3000)
        End If
    End Sub
End Module
