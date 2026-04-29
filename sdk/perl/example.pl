#!/usr/bin/perl
use strict;
use warnings;
use lib '.';
use AuthCoreSDK;

system("title AuthCore Perl Security Console") if $^O eq 'MSWin32';

print "========================================\n";
print "      AUTHCORE PERL SECURITY SDK        \n";
print "========================================\n";

my $BASE_URL    = "https://auth-core-sz7p.vercel.app";
my $APP_ID      = 2;
my $APP_SECRET  = "PxMzYyvs5zzA2f39MaXlMgJfGGY4qftQ";
my $APP_VERSION = "1.0";

my $sdk = AuthCoreSDK->new($BASE_URL, $APP_ID, $APP_SECRET, $APP_VERSION);

print "\n[>] Enter Licence Key: ";
my $key = <STDIN>;
chomp $key;

unless ($key) {
    print "[!] Key required.\n";
    exit 1;
}

print "[*] Authenticating...\n";
my $res = $sdk->verify($key);

if ($res->{success}) {
    print "\n[+] Access Granted! Welcome, $res->{message}\n";
    $sdk->start_heartbeat(15000);
    print "\n[*] Application is running.\n";
    print "[*] Admin broadcasts will appear in a MessageBox.\n";
    print "[*] Press Ctrl+C to exit.\n";
    sleep(86400) while 1;
} else {
    print "\n[-] Access Denied: $res->{message}\n";
    sleep 3;
}
