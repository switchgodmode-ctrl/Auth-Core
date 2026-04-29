package AuthCoreSDK;

use strict;
use warnings;
use LWP::UserAgent;
use JSON;
use threads;
use Time::HiRes qw(sleep);

sub new {
    my ($class, $base_url, $app_id, $app_secret, $app_version) = @_;
    $base_url =~ s|/$||;
    return bless {
        base_url    => $base_url,
        app_id      => $app_id,
        app_secret  => $app_secret,
        app_version => $app_version,
        license_key => undef,
        ua          => LWP::UserAgent->new(timeout => 10),
    }, $class;
}

sub get_hwid {
    my $hostname = `hostname`;
    chomp $hostname;
    return "$hostname-PERL-WIN";
}

sub show_message {
    my ($self, $message, $title) = @_;
    $title //= "Admin Broadcast";
    $message =~ s/'/`'/g;
    my $cmd = "powershell -Command \"[Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); [System.Windows.Forms.MessageBox]::Show('$message', '$title')\"";
    system("start /B $cmd");
}

sub _post {
    my ($self, $endpoint, $data) = @_;
    my $url     = $self->{base_url} . $endpoint;
    my $payload = encode_json($data);
    my $resp    = $self->{ua}->post($url,
        'Content-Type' => 'application/json',
        Content        => $payload,
    );
    return eval { decode_json($resp->decoded_content) } // {};
}

sub verify {
    my ($self, $license_key) = @_;
    $self->{license_key} = $license_key;
    my $payload = {
        appId         => $self->{app_id},
        appVersion    => $self->{app_version},
        appSecret     => $self->{app_secret},
        licenceKey    => $license_key,
        hwid          => get_hwid(),
        integrityHash => "none",
    };

    my $res     = $self->_post('/runtime/validate', $payload);
    my $success = ($res->{status} // '') eq 'true' || ($res->{allowed} // 0);

    if ($success && $res->{customMessage}) {
        $self->show_message($res->{customMessage});
    }

    return {
        success => $success,
        message => $res->{message} // "Unknown Error",
        data    => $res,
    };
}

sub start_heartbeat {
    my ($self, $interval_ms) = @_;
    $interval_ms //= 15000;

    my $app_id      = $self->{app_id};
    my $license_key = $self->{license_key};
    my $base_url    = $self->{base_url};
    my $self_ref    = $self;

    threads->create(sub {
        while (1) {
            sleep($interval_ms / 1000);
            my $res = $self_ref->_post('/runtime/heartbeat', {
                appId      => $app_id,
                licenceKey => $license_key,
            });

            if ($res->{customMessage}) {
                $self_ref->show_message($res->{customMessage});
            }

            if (($res->{status} // '') eq 'true' && ($res->{currentStatus} // '') eq 'killed') {
                $self_ref->show_message("Session terminated by administrator.", "Security Alert");
                sleep(2);
                exit(1);
            }
        }
    })->detach();
}

1;
