require 'net/http'
require 'json'
require 'uri'

module AuthCore
  class SDK
    def initialize(base_url, app_id, app_secret, app_version)
      @base_url    = base_url.chomp('/')
      @app_id      = app_id
      @app_secret  = app_secret
      @app_version = app_version
      @license_key = nil
    end

    def get_hwid
      hostname = `hostname`.strip rescue 'Unknown'
      "#{hostname}-RUBY-WIN"
    end

    def show_message(message, title = 'Admin Broadcast')
      if RUBY_PLATFORM =~ /win|mingw/i
        escaped = message.gsub("'", "''")
        cmd = "powershell -Command \"[Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); [System.Windows.Forms.MessageBox]::Show('#{escaped}', '#{title}')\""
        Thread.new { system(cmd) }
      else
        puts "\n[#{title}] #{message}"
      end
    end

    def post(endpoint, data)
      uri = URI("#{@base_url}#{endpoint}")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == 'https'
      http.open_timeout = 10
      http.read_timeout = 10

      request = Net::HTTP::Post.new(uri, 'Content-Type' => 'application/json')
      request.body = data.to_json

      response = http.request(request)
      JSON.parse(response.body)
    rescue => e
      { 'error' => e.message }
    end

    def verify(license_key)
      @license_key = license_key
      payload = {
        appId: @app_id, appVersion: @app_version,
        appSecret: @app_secret, licenceKey: license_key,
        hwid: get_hwid, integrityHash: 'none'
      }

      res = post('/runtime/validate', payload)
      success = res['status'] == 'true' || res['allowed'] == true

      show_message(res['customMessage']) if success && !res['customMessage'].to_s.empty?

      { success: success, message: res['message'] || 'Unknown Error', data: res }
    end

    def start_heartbeat(interval_ms = 15000)
      Thread.new do
        loop do
          sleep(interval_ms / 1000.0)
          res = post('/runtime/heartbeat', { appId: @app_id, licenceKey: @license_key })
          show_message(res['customMessage']) if !res['customMessage'].to_s.empty?
          if res['status'] == 'true' && res['currentStatus'] == 'killed'
            show_message('Session terminated by administrator.', 'Security Alert')
            sleep(2)
            exit(1)
          end
        end
      end
    end
  end
end
