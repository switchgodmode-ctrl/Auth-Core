Imports System
Imports System.Net.Http
Imports System.Text
Imports System.Threading
Imports System.Runtime.InteropServices

Public Class AuthCoreSDK

    Private ReadOnly BaseUrl As String
    Private ReadOnly AppId As Integer
    Private ReadOnly AppSecret As String
    Private ReadOnly AppVersion As String
    Private LicenseKey As String

    <DllImport("user32.dll", CharSet:=CharSet.Unicode)>
    Private Shared Function MessageBox(hWnd As IntPtr, text As String, caption As String, uType As UInteger) As Integer
    End Function

    Public Sub New(baseUrl As String, appId As Integer, appSecret As String, appVersion As String)
        Me.BaseUrl = baseUrl.TrimEnd("/"c)
        Me.AppId = appId
        Me.AppSecret = appSecret
        Me.AppVersion = appVersion
    End Sub

    Public Function GetHwid() As String
        Dim hostname As String = Environment.MachineName
        Dim user As String = Environment.UserName
        Return $"{hostname}-{user}-VBNET"
    End Function

    Public Sub ShowMessage(message As String, Optional title As String = "Admin Broadcast")
        Thread.CurrentThread.IsBackground = True
        Dim t As New Thread(Sub()
            MessageBox(IntPtr.Zero, message, title, &H40)
        End Sub)
        t.IsBackground = True
        t.Start()
    End Sub

    Public Class AuthResponse
        Public Property Success As Boolean
        Public Property Message As String
        Public Property CustomMessage As String
        Public Property CurrentStatus As String
    End Class

    Private Function Post(endpoint As String, payload As String) As String
        Using client As New HttpClient()
            client.Timeout = TimeSpan.FromSeconds(10)
            Dim content As New StringContent(payload, Encoding.UTF8, "application/json")
            Dim response = client.PostAsync(BaseUrl & endpoint, content).Result
            Return response.Content.ReadAsStringAsync().Result
        End Using
    End Function

    Private Function ExtractJson(json As String, key As String) As String
        Dim search As String = $"""{key}"":"
        Dim idx As Integer = json.IndexOf(search)
        If idx < 0 Then Return Nothing
        Dim start As Integer = idx + search.Length
        If json(start) = """"c Then
            start += 1
            Dim endIdx As Integer = json.IndexOf("""", start)
            Return json.Substring(start, endIdx - start)
        Else
            Dim endIdx As Integer = json.IndexOfAny({","c, "}"c}, start)
            Return json.Substring(start, endIdx - start).Trim()
        End If
    End Function

    Public Function Verify(licenseKey As String) As AuthResponse
        Me.LicenseKey = licenseKey
        Dim payload As String = $"{{""appId"":{AppId},""appVersion"":""{AppVersion}"",""appSecret"":""{AppSecret}"",""licenceKey"":""{licenseKey}"",""hwid"":""{GetHwid()}"",""integrityHash"":""none""}}"

        Try
            Dim responseJson As String = Post("/runtime/validate", payload)
            Dim res As New AuthResponse()
            res.Success = ExtractJson(responseJson, "status") = "true" OrElse ExtractJson(responseJson, "allowed") = "true"
            res.Message = ExtractJson(responseJson, "message") ?? "Unknown Error"
            res.CustomMessage = ExtractJson(responseJson, "customMessage")

            If res.Success AndAlso Not String.IsNullOrEmpty(res.CustomMessage) Then
                ShowMessage(res.CustomMessage)
            End If
            Return res
        Catch ex As Exception
            Return New AuthResponse() With {.Success = False, .Message = $"Network Error: {ex.Message}"}
        End Try
    End Function

    Public Sub StartHeartbeat(intervalMs As Integer)
        Dim t As New Thread(Sub()
            While True
                Thread.Sleep(intervalMs)
                Try
                    Dim payload As String = $"{{""appId"":{AppId},""licenceKey"":""{LicenseKey}""}}"
                    Dim responseJson As String = Post("/runtime/heartbeat", payload)
                    Dim customMsg As String = ExtractJson(responseJson, "customMessage")
                    Dim status As String = ExtractJson(responseJson, "status")
                    Dim currentStatus As String = ExtractJson(responseJson, "currentStatus")

                    If Not String.IsNullOrEmpty(customMsg) Then ShowMessage(customMsg)

                    If status = "true" AndAlso currentStatus = "killed" Then
                        ShowMessage("Session terminated by administrator.", "Security Alert")
                        Thread.Sleep(2000)
                        Environment.Exit(1)
                    End If
                Catch
                End Try
            End While
        End Sub)
        t.IsBackground = True
        t.Start()
    End Sub
End Class
