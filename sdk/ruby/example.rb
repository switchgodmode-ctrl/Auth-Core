require_relative 'sdk'

system('title AuthCore Ruby Security Console') if RUBY_PLATFORM =~ /win|mingw/i

puts "========================================"
puts "      AUTHCORE RUBY SECURITY SDK        "
puts "========================================"

BASE_URL    = "https://auth-core-sz7p.vercel.app"
APP_ID      = 2
APP_SECRET  = "PxMzYyvs5zzA2f39MaXlMgJfGGY4qftQ"
APP_VERSION = "1.0"

sdk = AuthCore::SDK.new(BASE_URL, APP_ID, APP_SECRET, APP_VERSION)

print "\n[>] Enter Licence Key: "
key = gets.chomp

if key.empty?
  puts "[!] Key required."
  exit 1
end

puts "[*] Authenticating..."
res = sdk.verify(key)

if res[:success]
  puts "\n[+] Access Granted! Welcome, #{res[:message]}"
  sdk.start_heartbeat(15000)
  puts "\n[*] Application is running."
  puts "[*] Admin broadcasts will appear in a MessageBox."
  puts "[*] Press Ctrl+C to exit."
  sleep
else
  puts "\n[-] Access Denied: #{res[:message]}"
  sleep 3
end
