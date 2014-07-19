// Copyright © 2014 Nature Publishing Group
//
// This file is part of boomcatch.
//
// Boomcatch is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Boomcatch is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with boomcatch. If not, see <http://www.gnu.org/licenses/>.

'use strict';

var assert, mockery, spooks, modulePath, nop;

assert = require('chai').assert;
mockery = require('mockery');
spooks = require('spooks');

modulePath = '../src';

nop = function () {};

mockery.registerAllowable(modulePath);
mockery.registerAllowable('check-types');
mockery.registerAllowable('url');
mockery.registerAllowable('qs');

process.setMaxListeners(233);

suite('index:', function () {
    var log, restrict, cluster, isTooBusy;

    setup(function () {
        log = {};
        cluster = spooks.obj({
            archetype: { fork: nop, on: nop },
            log: log
        });
        mockery.enable({ useCleanCache: true });
        mockery.registerMock('http', spooks.obj({
            archetype: { createServer: nop, listen: nop },
            log: log,
            chains: { createServer: true }
        }));
        mockery.registerMock('https', spooks.obj({
            archetype: { options: {}, createServer: nop, listen: nop },
            log: log,
            chains: { createServer: true }
        }));
        mockery.registerMock('./validators/permissive', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: spooks.fn({
                    name: 'validator',
                    log: log,
                    result: true
                })
            }
        }));
        mockery.registerMock('./filters/unfiltered', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: function (data) {
                    log.counts.filter += 1;
                    log.args.filter.push(arguments);
                    log.these.filter.push(this);
                    return data;
                }
            }
        }));
        mockery.registerMock('./mappers/statsd', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: spooks.fn({
                    name: 'mapper',
                    log: log,
                    result: 'default mapped data'
                })
            }
        }));
        mockery.registerMock('./forwarders/udp', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: spooks.fn({
                    name: 'forwarder',
                    log: log
                })
            }
        }));
        mockery.registerMock('./validators/restrictive', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: function () {
                    log.counts.validator += 1;
                    log.these.validator.push(this);
                    log.args.validator.push(arguments);
                    return !restrict;
                }
            }
        }));
        mockery.registerMock('./filters/filtered', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: spooks.fn({
                    name: 'filter',
                    log: log,
                    result: {}
                })
            }
        }));
        mockery.registerMock('./mappers/mapper', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: spooks.fn({
                    name: 'mapper',
                    log: log,
                    result: 'alternative mapped data'
                })
            }
        }));
        mockery.registerMock('./forwarders/forwarder', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: spooks.fn({
                    name: 'forwarder',
                    log: log
                })
            }
        }));
        mockery.registerMock('./mappers/failing', spooks.obj({
            archetype: { initialise: nop },
            log: log,
            results: {
                initialise: spooks.fn({
                    name: 'mapper',
                    log: log,
                    result: ''
                })
            }
        }));
        mockery.registerMock('toobusy-js', function () {
            log.counts.toobusy += 1;
            log.these.toobusy.push(this);
            log.args.toobusy.push(arguments);
        });
        log.counts.toobusy = 0;
        log.these.toobusy = [];
        log.args.toobusy = [];
        mockery.registerMock('cluster', cluster);

        var fsMock = {
            readFileSync: function (path) {
                if (path === 'test.key') {
                    return '-----BEGIN RSA PRIVATE KEY-----\
MIIEpAIBAAKCAQEA7pQBa8OkJrpWZhUJvbJVd21eJ8JvYVbpimFEOSsAFX+unWvM\
zIRFq4ORukEAxVblqc9pNfRrtEc+grAF6Buhhk4v6kfM9rsqQ/XFHPowWMRp+gM5\
FdiGilGvJbV5HWxfpQGwvhGxBQbVRdYe2ogufxm1IrLF4ZsKXocVAuFW5Qpd8JGe\
iFFvugyznY6g6XW8O4nLdZKKKFQn/U2KmTBxOVqh00w8RqIiPIJ+ONxITPZAkbMm\
tIpBEQBJj+LIsSmOsaxT0mdRn1+1kMr2SL3UgiC+VVFhNcoEiioSYagb8SrCQTHp\
lrSplNo7skQcOBh9Lwt+mSG/8DaxOjRfWq+zZQIDAQABAoIBAQDXQg0iKUwjcT7h\
Lhwy3wPEFJa+cu1Bu0ROCcKffg++Vgy7lncbFEE0JirHDT1f0C65jx1ThCvlZd6d\
1aoOqVeMsWEEFjJ1b5wL42Us5wPWI6mm3V+VOV7y0A6ijGExzgViAOtyIs5ARdEK\
CM6fx/2DyjMnknt+OgAaF/E6PwzC62BsojRH0dJpswdACWPkc1Z5Jm61qapdB1Jy\
SRdP39bMqk3S0lK3a3+A3/a/iAu54kW3gvNrHTpVoli4LIjum1IgN956cQ1i2eO5\
p7ULJSPR/cOAfJJld3h1E7TYzQqCu3eITXO+elah7vdLK8j5P4RtRsyTRRF2sYam\
PVgdzUglAoGBAP+h8rupfxQPyvMIuLCGyCutclOYFOBh5vHTaHxSM/AhUVFu7I7L\
OqvYeVvu+JgeonCDypuV9q9F+KuojRY5a2Byf7IwBK7Eto3glnMVQAO6t6CUKAj1\
B+ZK0NnJWGl1mLEu2QmmwDq2dTrxSFYlw/B8zzz97Zl/x6ky+qPrX7OzAoGBAO7r\
yGEX1JYxCo2SjSUxBOSJ0+Dyf+suI1Zkp6ve8BxWrpKYpVtG7maOgB2GMJS+/S3t\
0yk139M5NHex2CLjTPkdSdNdTJrPgu2z4zZqgzxuuI7btpURRR3XqwVBTfAo7oB+\
S7aYsi0I/04X1sdTtLpb5wUwiclH5L7WP1QYsFCHAoGAC92WiMNrVKEPCIzlFbyL\
2gso/VxXy7p/n8XyWaLvKjxBrAf8Dvy78nIP4AaNn3H8lEBpzSL+2k/jJQSj194+\
b7Gg38J+1SXoW1mLYjggSowGLfvyh8fn3/alDxbbdbmxprfH9zy4O4Fwm5XLh8Qk\
/iqs6+XVe4SE3gOxwp4QSSUCgYB62G76RUeARgz4CA9cvRyX6aowsl9FbD6tMCnq\
PEHXQFaYd7Yl/Y2c285R3+pgwObq06rMOLAyKeqpVJ8eKSMtv3pzHDjELMhUMjc0\
hoWd8AwjICN7+BpCot6DYDWTs2gWV1nUtCSA9WxYGffMG2UEoTZiu7dM8BNUcFK1\
idA2RwKBgQC4TWXMdCI7HRM53gZHi3f9+d+KiX4OFc/fmvNCT/usPme0BVmvf8a6\
tDOo94tCrn5zzPGXWowAUbLbfVAB8Q77kqRY4LEJj4SxkZmhfx9BZz5Ft/LZQ1tI\
qiskYWjXpLQvNhXdO7uiacUUKIs8lvIfS6JJjOkBitTWGJ/Rzd0hQQ==\
-----END RSA PRIVATE KEY-----';
                } else if (path === 'test.crt') {
                    return '-----BEGIN CERTIFICATE-----\
MIIDBjCCAe4CCQDX9nxekJVCsDANBgkqhkiG9w0BAQUFADBFMQswCQYDVQQGEwJB\
VTETMBEGA1UECBMKU29tZS1TdGF0ZTEhMB8GA1UEChMYSW50ZXJuZXQgV2lkZ2l0\
cyBQdHkgTHRkMB4XDTE0MDcxOTA1NDQwM1oXDTE1MDcxOTA1NDQwM1owRTELMAkG\
A1UEBhMCQVUxEzARBgNVBAgTClNvbWUtU3RhdGUxITAfBgNVBAoTGEludGVybmV0\
IFdpZGdpdHMgUHR5IEx0ZDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEB\
AO6UAWvDpCa6VmYVCb2yVXdtXifCb2FW6YphRDkrABV/rp1rzMyERauDkbpBAMVW\
5anPaTX0a7RHPoKwBegboYZOL+pHzPa7KkP1xRz6MFjEafoDORXYhopRryW1eR1s\
X6UBsL4RsQUG1UXWHtqILn8ZtSKyxeGbCl6HFQLhVuUKXfCRnohRb7oMs52OoOl1\
vDuJy3WSiihUJ/1NipkwcTlaodNMPEaiIjyCfjjcSEz2QJGzJrSKQREASY/iyLEp\
jrGsU9JnUZ9ftZDK9ki91IIgvlVRYTXKBIoqEmGoG/EqwkEx6Za0qZTaO7JEHDgY\
fS8Lfpkhv/A2sTo0X1qvs2UCAwEAATANBgkqhkiG9w0BAQUFAAOCAQEAuwOyEma4\
QXDCH9FAvnkLz/HFtRxMS1X0A0pbArCLCNksI/grk3Gaz2iZBnuiQC7ZO+Ll6Z6+\
qBtYe86j5DDi7sZr16VNldp36V7ZrEWow5vEc7vQe5eAmBSZb+cOUnbu34CBMmMO\
v1eqmu3gqgkoa483MEnu0npesmCj8mQAzK5uL4z9kYfZqt0IqmoeFXG1OsnS/MTN\
WwgK9aO+h44ds6hBTqtMFmmbZEO/4m15XmMBFw823rNkJOoarLLZvdyQMe/8rhjp\
1dAsyuto2iaBqrL0vqGEv8HkynYp0BjwJb+80RseBGde1YWEgt5RoapRn1NmPp5e\
6U26hRmrOfw90g==\
-----END CERTIFICATE-----';
                } else if (path === 'test.pfx') {
                    return '3082 0949 0201 0330 8209 0f06 092a 8648\
86f7 0d01 0701 a082 0900 0482 08fc 3082\
08f8 3082 03af 0609 2a86 4886 f70d 0107\
06a0 8203 a030 8203 9c02 0100 3082 0395\
0609 2a86 4886 f70d 0107 0130 1c06 0a2a\
8648 86f7 0d01 0c01 0630 0e04 0867 fc37\
ddb1 7e2b 2902 0208 0080 8203 6891 fdf2\
bbb6 926a bcb8 8a05 a435 a351 2154 cad8\
ce3e 34f1 8275 a8a7 ebcd 03b4 9dc8 e53a\
520e 7321 f522 b77b 3b0c a0f8 55a4 8f06\
4774 fc85 e498 a41b 6761 cf60 684e 9c35\
fcd1 f356 9ada 9a25 42b7 8ff6 2a92 2db3\
ae90 9df8 adcc 4320 8694 b4c1 5372 e6c7\
7d2a 8d68 9077 2572 4b3f 42ba 84c8 697e\
cb1e b25d e621 0aa8 b233 682a ddc9 a319\
327a 3372 992d 14e7 ae81 614b 314f 8ba2\
e7fa ca54 41d6 3e4c fb17 e512 b334 7990\
826c d457 b60c c8e9 235f 606b 3c61 137c\
ae87 1c33 989e a684 14c1 38d5 1aff a43a\
c76d dd53 8306 55b1 8427 20fe f827 6f89\
82fa d04f 47aa 68d5 ea69 e527 f71c 7a31\
46b0 c214 e97d 0db6 3626 8713 c9e0 a7a5\
3eb1 ce41 3d3c 54e6 541b 7ecc 9873 93ee\
93e5 151e cd6a 92f5 a028 c6d1 a00a 81b8\
bb6d 120e b73b 2fb3 b061 4ab6 8ae8 2a2b\
2d68 ab12 1168 bc16 70f8 6de3 5d45 59f5\
3d9c 9dde 51f3 26ed 4ae4 68b0 dcfc 78ec\
f5fc 23c9 13c7 ca92 5331 0d74 a6e8 f72e\
77e7 62d5 5a8e 28e5 6103 62b9 bd1c 0d24\
8a5e eedb 9bbf 1ea4 eaae ee26 18f7 728c\
f2ec b5ee 56dc da68 7f44 79b5 7997 c8b2\
f1db f8ed 0f96 1e52 7168 3df2 feee 271b\
25cc 80cc 7df0 aff5 bb5e 972a 4d97 f61c\
d3e9 c111 a9e8 72dc 80e6 702d 48f4 e2dd\
2055 f608 3d48 2b3f ee12 bd82 a82d a622\
17d7 a786 d24f af45 46b9 f451 db4a 6585\
fbef b280 ff51 3ede f58b e3e5 88f8 a901\
b6c0 5d8f d0ef 9d24 11e3 bef0 9e18 4409\
dcaa 3079 0886 9c48 ee7a 7877 a187 1eef\
db0c 7523 eac5 ad45 2cbe 19bf b2bf ff46\
353b 7348 5cfb 3568 16c9 bbce 5f4a 9c8c\
03a2 12ee 3a2d a882 edd5 f99f f7f7 d6d4\
c847 a47c 33f9 2b55 0829 3299 2879 2b71\
6b68 aaee 2f16 b5f7 0d3e 8264 0b48 8da1\
9c2d 8934 54be fc92 6f1b 414e 031a d740\
64e1 5a9f 8f5f 7d88 c86a 1f26 a511 0070\
33c2 f3e7 d510 540d 5c43 ef05 6a60 2b95\
6628 f11a 79a4 5606 834a 0c1b 843c 09a0\
bc49 cf2f 0c4d 6a72 a41c ff01 b5e5 7cf6\
a184 65d4 773d 7d05 6d75 268b 6a68 251e\
f9f2 24be ee90 4599 4c00 817d 8427 8b96\
3225 ff00 2141 34fa 7e73 3a28 10bd e264\
c0df cb2b 5696 e482 e884 6c1d b656 4af6\
a541 25eb d945 8a1b d886 c445 8757 3600\
3407 406f 7a88 4a7f 262f 4e2c d68f 8730\
a327 ce02 cfe1 d133 c89a ad26 353b 52b0\
d496 a6f0 2eed 3058 3e4f be8a dc40 e61c\
e0fe 6035 90b0 85dd e13c 6e16 a683 89b6\
19dc 7b99 914f a56d 1c12 7480 8490 e4f1\
0801 26c0 1570 7b9a 99c2 1155 f834 2bc5\
a0da a1a0 de4a 6460 8779 fc81 9661 5a72\
9e08 6d7d 8430 8205 4106 092a 8648 86f7\
0d01 0701 a082 0532 0482 052e 3082 052a\
3082 0526 060b 2a86 4886 f70d 010c 0a01\
02a0 8204 ee30 8204 ea30 1c06 0a2a 8648\
86f7 0d01 0c01 0330 0e04 0826 8ce4 0d79\
bef3 ef02 0208 0004 8204 c84c bbee e954\
0373 6cff 867c 1874 1f1a 11b9 6244 5285\
d67b 92d5 16d2 b17f 12b2 6905 14bc cf95\
a1e0 7405 1fbe 410a 41a8 8f60 8bb1 34fd\
b8d1 2601 3b12 222f fea5 69cc 8fef 2615\
f2f0 2831 c4d7 b034 5e7e 0d11 2935 73de\
e81c 1428 7716 2c2a 7c2c 7056 2135 5c8b\
a4ff 72a1 c42d 7c92 f8a0 1acd 68fc 0310\
fe33 81eb df1a 3ffa 5803 5ce7 8def 90b5\
6ae0 83da a7b3 7d06 ea9a 0403 4492 1b07\
084a eadc a102 6ffb 0e2a 11f4 1c7d bac0\
df4a 3785 5022 abdb f060 4ff5 3fcf 844d\
6803 7b48 99de cc39 86d6 a9cf 3b16 d582\
97e0 104a 4c78 173f 222e a87d 3883 b4ad\
8765 8330 6f1e 82e7 3b5f d0e6 f343 6a65\
98c0 6707 744c 87aa 3ef2 12c4 8350 f0ab\
7454 977b cd5b aa6f b865 2b40 ff2d 1b0b\
eaf3 7a28 d9e1 0217 c70f 8050 47a7 3750\
c8b2 7055 8335 5c65 73d0 d153 7c8e a3dd\
9bda 23d2 4138 60a3 cf67 2b21 0252 6ef5\
44dc 2331 b69f 51b3 dea5 adbc 7eb2 55e3\
37b5 9d35 b59b 05c2 7aa3 f7f1 29f8 6e2e\
f8fb 6a3b bc4c e77c 6c3d 1c8c 1083 f5f5\
cebd 5f17 328b a624 1d0c 6c4f d52c c488\
0b0d e7d4 8e93 a4b6 b541 2f6d 167e 82c8\
6c85 0b07 1e26 adb6 7967 065a 050f 1b1d\
1c3f 3797 6937 ce13 0495 c84b b093 4753\
c27b 9cf4 19bc 86ea 5350 b62b c940 d1f8\
dd10 0572 cceb b42c 29d2 bb05 6aeb c7e6\
8ed4 627f 7ab3 ec5d d2ea eb8c d560 2be5\
f7a2 5d13 b7ca f406 6011 2171 793f bb51\
5693 ccf3 97f5 5d7e 05ac 8c12 44ff 972d\
fadf daff ab44 e7e8 6509 b15b e395 7c0c\
8a58 196d 7923 8288 e66d f3c0 684e 0aa7\
6ae8 bb80 f024 0cec 9668 54f5 47fd 494d\
4a6f c09c c27a 4508 f662 5c25 2ccb d880\
7d8d 4028 a1f9 3de0 d9e7 b531 5056 df74\
b763 655c 0a34 3126 8dd4 8edc 6568 e48d\
b557 95a0 ae7f 6b12 ff25 db48 da46 6018\
ffe7 ce3e a750 87af 1222 724f ec4e 041e\
462f 592a 853f 6e25 4b99 b69d d955 2a47\
78ec 7ff4 ee51 40af 3251 37ec 8e30 2c99\
83ae 1f7a 896e 92d6 b232 288c 37c6 8402\
703e aeb0 5b95 69de b36e 6003 ca26 6b75\
8f15 2d58 a38d 53e2 f6bc 2fb7 31dc 618f\
5ad5 fab2 f0a8 283b ebf1 bfe4 04f7 bc10\
f709 4783 2e61 fbd1 adf8 0fb4 817a 7a1b\
204f 4685 bd4b 3fcd de26 4e3d f295 9c08\
1f9e 05b9 8353 d48d c572 62eb 9c09 bd67\
e8ba 035a 7cb3 d2ce c54b 6503 4d1f 14d5\
3255 0da0 28a5 87fe b20f b164 9961 b947\
99fb feca 7017 5866 7598 d08a e14a 68ac\
4480 ae90 98bc 66bb d4b5 b2b7 fff2 e054\
7f47 968f 0522 1f0e 6262 2bbc 0a7b 5883\
3cb2 bf9c ac9f bb98 8556 2b68 76e3 9307\
6ccd 81eb fc1a 5864 1cea 5617 fab8 bbc7\
68c4 6f66 c88b 2535 9d63 1b63 c283 c3aa\
41a0 3bf2 3f52 f999 1bfd c785 bbf3 910d\
432a 3b04 50b5 70ff 6b39 8eeb 8de2 9dc3\
5f54 44f6 2b61 83b1 63c3 ca0a 2c1b a1a7\
ce7a 8d71 6c73 2748 e896 51d4 d74d 3b46\
3ba0 9efe 7f5f d74f 3629 cbd8 7607 1129\
e2be a5d2 6461 1889 caa7 4827 943a e21e\
eb1c 19cf 33d8 a56e 5660 9b18 934d 05b3\
e9b9 fb28 0967 f825 cac4 b542 6dce b4ca\
3957 cb4c 02a3 365c 253b a74b d592 f1fc\
bb00 b507 dbf8 0ec5 45a1 79b8 806c 6cf7\
5fa9 3bb0 1066 5b8f 52a2 dd89 ac76 92ce\
4b80 cf47 6a15 833a aa5b 27b0 f42d 0c63\
1888 118f 97ae d7a0 a678 25fd e906 db04\
c1be 6e5a ffc7 ec81 c0d7 f965 a224 35d5\
99a1 d754 6bdb 9b92 039e df81 fc21 f511\
46fe d19a 6693 ad43 39ed 5716 a809 50db\
232d 3d9d 002f 1e97 a9a6 a7bb 2a5a 1c8f\
5f50 7cec e3b5 bedc ff2c a2ee 0f60 67b3\
61a3 be61 1ad7 9422 03cf 20eb 7594 383d\
bb47 8dd9 24d5 43dc 6b91 3cc6 351f 4e97\
7ff9 8031 2530 2306 092a 8648 86f7 0d01\
0915 3116 0414 5d55 df77 1aac dd23 fff3\
ee8f b239 5857 f52e 5ca0 3031 3021 3009\
0605 2b0e 0302 1a05 0004 146d 2c89 26b5\
09ae b928 82fc 9862 23de ba29 eae1 a204\
08f1 1471 137b d2b5 3c02 0208 00';
                }
            }
        };
        mockery.registerMock('fs', fsMock);
    });

    teardown(function () {
        mockery.deregisterMock('cluster');
        mockery.deregisterMock('toobusy-js');
        mockery.deregisterMock('./mappers/failing');
        mockery.deregisterMock('./forwarders/forwarder');
        mockery.deregisterMock('./mappers/mapper');
        mockery.deregisterMock('./filters/filtered');
        mockery.deregisterMock('./validators/restrictive');
        mockery.deregisterMock('./forwarders/udp');
        mockery.deregisterMock('./mappers/statsd');
        mockery.deregisterMock('./filters/unfiltered');
        mockery.deregisterMock('./validators/permissive');
        mockery.deregisterMock('http');
        mockery.deregisterMock('https');
        mockery.deregisterMock('fs');
        mockery.disable();
        log = undefined;
    });

    test('require does not throw', function () {
        assert.doesNotThrow(function () {
            require(modulePath);
        });
    });

    test('require returns object', function () {
        assert.isObject(require(modulePath));
    });

    suite('require:', function () {
        var boomcatch;

        setup(function () {
            boomcatch = require(modulePath);
        });

        teardown(function () {
            boomcatch = undefined;
        });

        test('listen function is exported', function () {
            assert.isFunction(boomcatch.listen);
        });

        test('listen does not throw without options', function () {
            assert.doesNotThrow(function () {
                boomcatch.listen();
            });
        });

        test('listen throws if host is empty string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: function () {},
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2,
                    key: '',
                    cert: '',
                    pfx: '',
                    passphrase: '',
                    ca: [],
                    crl: [],
                    ciphers: '',
                    handshakeTimeout: 0,
                    honorCipherOrder: 0,
                    requestCert: 0,
                    rejectUnauthorized: 0,
                    NPNProtocols: [],
                    SNICallback: function() {},
                    sessionIdContext: '',
                    secureProtocol: ''
                });
            });
        });

        test('listen throws if port is string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: '80',
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: function () {},
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2
                });
            });
        });

        test('listen throws if path is empty string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: function () {},
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2,
                    key: '',
                    cert: '',
                    pfx: '',
                    passphrase: '',
                    ca: [],
                    crl: [],
                    ciphers: '',
                    handshakeTimeout: 0,
                    honorCipherOrder: 0,
                    requestCert: 0,
                    rejectUnauthorized: 0,
                    NPNProtocols: [],
                    SNICallback: function() {},
                    sessionIdContext: '',
                    secureProtocol: ''
                });
            });
        });

        test('listen throws if referer is string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: 'bar',
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: function () {},
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2,
                    key: '',
                    cert: '',
                    pfx: '',
                    passphrase: '',
                    ca: [],
                    crl: [],
                    ciphers: '',
                    handshakeTimeout: 0,
                    honorCipherOrder: 0,
                    requestCert: 0,
                    rejectUnauthorized: 0,
                    NPNProtocols: [],
                    SNICallback: function() {},
                    sessionIdContext: '',
                    secureProtocol: ''
                });
            });
        });

        test('listen throws if origin is not a URL', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'baz',
                    limit: 100,
                    maxSize: 1024,
                    log: function () {},
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2,
                    key: '',
                    cert: '',
                    pfx: '',
                    passphrase: '',
                    ca: [],
                    crl: [],
                    ciphers: '',
                    handshakeTimeout: 0,
                    honorCipherOrder: 0,
                    requestCert: 0,
                    rejectUnauthorized: 0,
                    NPNProtocols: [],
                    SNICallback: function() {},
                    sessionIdContext: '',
                    secureProtocol: ''
                });
            });
        });

        test('listen throws if limit is string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: '100',
                    maxSize: 1024,
                    log: function () {},
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2,
                    key: '',
                    cert: '',
                    pfx: '',
                    passphrase: '',
                    ca: [],
                    crl: [],
                    ciphers: '',
                    handshakeTimeout: 0,
                    honorCipherOrder: 0,
                    requestCert: 0,
                    rejectUnauthorized: 0,
                    NPNProtocols: [],
                    SNICallback: function() {},
                    sessionIdContext: '',
                    secureProtocol: ''
                });
            });
        });

        test('listen throws if maxSize is string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: '1024',
                    log: function () {},
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2,
                    key: '',
                    cert: '',
                    pfx: '',
                    passphrase: '',
                    ca: [],
                    crl: [],
                    ciphers: '',
                    handshakeTimeout: 0,
                    honorCipherOrder: 0,
                    requestCert: 0,
                    rejectUnauthorized: 0,
                    NPNProtocols: [],
                    SNICallback: function() {},
                    sessionIdContext: '',
                    secureProtocol: ''
                });
            });
        });

        test('listen throws if log is object', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: {},
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2,
                    key: '',
                    cert: '',
                    pfx: '',
                    passphrase: '',
                    ca: [],
                    crl: [],
                    ciphers: '',
                    handshakeTimeout: 0,
                    honorCipherOrder: 0,
                    requestCert: 0,
                    rejectUnauthorized: 0,
                    NPNProtocols: [],
                    SNICallback: function() {},
                    sessionIdContext: '',
                    secureProtocol: ''
                });
            });
        });

        test('listen throws if validator is empty string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: function () {},
                    validator: '',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2,
                    key: '',
                    cert: '',
                    pfx: '',
                    passphrase: '',
                    ca: [],
                    crl: [],
                    ciphers: '',
                    handshakeTimeout: 0,
                    honorCipherOrder: 0,
                    requestCert: 0,
                    rejectUnauthorized: 0,
                    NPNProtocols: [],
                    SNICallback: function() {},
                    sessionIdContext: '',
                    secureProtocol: ''
                });
            });
        });

        test('listen throws if filter is empty string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: function () {},
                    validator: 'restrictive',
                    filter: '',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2,
                    key: '',
                    cert: '',
                    pfx: '',
                    passphrase: '',
                    ca: [],
                    crl: [],
                    ciphers: '',
                    handshakeTimeout: 0,
                    honorCipherOrder: 0,
                    requestCert: 0,
                    rejectUnauthorized: 0,
                    NPNProtocols: [],
                    SNICallback: function() {},
                    sessionIdContext: '',
                    secureProtocol: ''
                });
            });
        });

        test('listen throws if mapper is empty string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: function () {},
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: '',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2,
                    key: '',
                    cert: '',
                    pfx: '',
                    passphrase: '',
                    ca: [],
                    crl: [],
                    ciphers: '',
                    handshakeTimeout: 0,
                    honorCipherOrder: 0,
                    requestCert: 0,
                    rejectUnauthorized: 0,
                    NPNProtocols: [],
                    SNICallback: function() {},
                    sessionIdContext: '',
                    secureProtocol: ''
                });
            });
        });

        test('listen throws if prefix is empty string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: function () {},
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: '',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2,
                    key: '',
                    cert: '',
                    pfx: '',
                    passphrase: '',
                    ca: [],
                    crl: [],
                    ciphers: '',
                    handshakeTimeout: 0,
                    honorCipherOrder: 0,
                    requestCert: 0,
                    rejectUnauthorized: 0,
                    NPNProtocols: [],
                    SNICallback: function() {},
                    sessionIdContext: '',
                    secureProtocol: ''
                });
            });
        });

        test('listen throws if forwarder is empty string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: function () {},
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: '',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2,
                    key: '',
                    cert: '',
                    pfx: '',
                    passphrase: '',
                    ca: [],
                    crl: [],
                    ciphers: '',
                    handshakeTimeout: 0,
                    honorCipherOrder: 0,
                    requestCert: 0,
                    rejectUnauthorized: 0,
                    NPNProtocols: [],
                    SNICallback: function() {},
                    sessionIdContext: '',
                    secureProtocol: ''
                });
            });
        });

        test('listen throws if fwdHost is empty string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: function () {},
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2,
                    key: '',
                    cert: '',
                    pfx: '',
                    passphrase: '',
                    ca: [],
                    crl: [],
                    ciphers: '',
                    handshakeTimeout: 0,
                    honorCipherOrder: 0,
                    requestCert: 0,
                    rejectUnauthorized: 0,
                    NPNProtocols: [],
                    SNICallback: function() {},
                    sessionIdContext: '',
                    secureProtocol: ''
                });
            });
        });

        test('listen throws if fwdPort is string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: function () {},
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: '8125',
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2,
                    key: '',
                    cert: '',
                    pfx: '',
                    passphrase: '',
                    ca: [],
                    crl: [],
                    ciphers: '',
                    handshakeTimeout: 0,
                    honorCipherOrder: 0,
                    requestCert: 0,
                    rejectUnauthorized: 0,
                    NPNProtocols: [],
                    SNICallback: function() {},
                    sessionIdContext: '',
                    secureProtocol: ''
                });
            });
        });

        test('listen throws if fwdSize is string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: function () {},
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: '256',
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2,
                    key: '',
                    cert: '',
                    pfx: '',
                    passphrase: '',
                    ca: [],
                    crl: [],
                    ciphers: '',
                    handshakeTimeout: 0,
                    honorCipherOrder: 0,
                    requestCert: 0,
                    rejectUnauthorized: 0,
                    NPNProtocols: [],
                    SNICallback: function() {},
                    sessionIdContext: '',
                    secureProtocol: ''
                });
            });
        });

        test('listen throws if workers is string', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: function () {},
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: '256',
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: '4',
                    key: '',
                    cert: '',
                    pfx: '',
                    passphrase: '',
                    ca: [],
                    crl: [],
                    ciphers: '',
                    handshakeTimeout: 0,
                    honorCipherOrder: 0,
                    requestCert: 0,
                    rejectUnauthorized: 0,
                    NPNProtocols: [],
                    SNICallback: function() {},
                    sessionIdContext: '',
                    secureProtocol: ''
                });
            });
        });

        test('listen throws if workers is negative number', function () {
            assert.throws(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: function () {},
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: '256',
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: -1,
                    key: '',
                    cert: '',
                    pfx: '',
                    passphrase: '',
                    ca: [],
                    crl: [],
                    ciphers: '',
                    handshakeTimeout: 0,
                    honorCipherOrder: 0,
                    requestCert: 0,
                    rejectUnauthorized: 0,
                    NPNProtocols: [],
                    SNICallback: function() {},
                    sessionIdContext: '',
                    secureProtocol: ''
                });
            });
        });

        test('listen does not throw if options are valid', function () {
            assert.doesNotThrow(function () {
                boomcatch.listen({
                    host: '127.0.0.1',
                    port: 80,
                    path: '/foo',
                    referer: /bar/,
                    origin: 'http://example.com/',
                    limit: 100,
                    maxSize: 1024,
                    log: {
                        info: function () {},
                        error: function () {}
                    },
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'prefix',
                    forwarder: 'forwarder',
                    fwdHost: '192.168.50.4',
                    fwdPort: 8125,
                    fwdSize: 256,
                    fwdUrl: 'http://example.com/',
                    fwdMethod: 'POST',
                    workers: 2,
                    key: '/path/to/key',
                    cert: '/path/to/cert',
                    pfx: 'key-string',
                    passphrase: 'passphrase',
                    ca: [
                        "ca1",
                        "ca2"
                    ],
                    crl: [
                        "crl1",
                        "crl2"
                    ],
                    ciphers: 'mock-cipher-sting',
                    handshakeTimeout: 1,
                    honorCipherOrder: 1,
                    requestCert: 1,
                    rejectUnauthorized: 1,
                    NPNProtocols: [
                        "protocol1",
                        "protocol2"
                    ],
                    SNICallback: function() {
                        console.log('test')
                    },
                    sessionIdContext: 'contextID',
                    secureProtocol: 'SSLv3_method'
                });
            });
        });

        test('listen does not throw if options are null', function () {
            assert.doesNotThrow(function () {
                boomcatch.listen({
                    host: null,
                    port: null,
                    path: null,
                    referer: null,
                    origin: null,
                    limit: null,
                    maxSize: null,
                    log: null,
                    validator: null,
                    filter: null,
                    mapper: null,
                    prefix: null,
                    forwarder: null,
                    fwdHost: null,
                    fwdPort: null,
                    fwdSize: null,
                    fwdUrl: null,
                    fwdMethod: null,
                    workers: null,
                    key: null,
                    cert: null,
                    pfx: null,
                    passphrase: null,
                    ca: null,
                    crl: null,
                    ciphers: null,
                    handshakeTimeout: null,
                    honorCipherOrder: null,
                    requestCert: null,
                    rejectUnauthorized: null,
                    NPNProtocols: null,
                    SNICallback: null,
                    sessionIdContext: null,
                    secureProtocol: null
                });
            });
        });

        suite('call listen with default options:', function () {
            setup(function () {
                boomcatch.listen();
            });

            test('?.initialise was called four times', function () {
                assert.strictEqual(log.counts.initialise, 4);
            });

            test('validator.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[0], require('./validators/permissive'));
                assert.lengthOf(log.args.initialise[0], 1);
                assert.isObject(log.args.initialise[0][0]);
            });

            test('filter.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[1], require('./filters/unfiltered'));
                assert.lengthOf(log.args.initialise[1], 1);
                assert.isObject(log.args.initialise[1][0]);
            });

            test('mapper.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[2], require('./mappers/statsd'));
                assert.lengthOf(log.args.initialise[2], 1);
                assert.isObject(log.args.initialise[2][0]);
                assert.isUndefined(log.args.initialise[2][0].prefix);
            });

            test('forwarder.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[3], require('./forwarders/udp'));
                assert.lengthOf(log.args.initialise[3], 1);
                assert.isObject(log.args.initialise[3][0]);
                assert.isUndefined(log.args.initialise[3][0].fwdHost);
                assert.isUndefined(log.args.initialise[3][0].fwdPort);
            });

            test('http.createServer was called once', function () {
                assert.strictEqual(log.counts.createServer, 1);
            });

            test('http.createServer was called correctly', function () {
                assert.strictEqual(log.these.createServer[0], require('http'));
                assert.lengthOf(log.args.createServer[0], 1);
                assert.isFunction(log.args.createServer[0][0]);
            });

            test('http.listen was called once', function () {
                assert.strictEqual(log.counts.listen, 1);
            });

            test('http.listen was called correctly', function () {
                assert.strictEqual(log.these.listen[0], require('http').createServer());
                assert.lengthOf(log.args.listen[0], 2);
                assert.strictEqual(log.args.listen[0][0], 80);
                assert.strictEqual(log.args.listen[0][1], '0.0.0.0');
            });

            test('cluster.fork was not called', function () {
                assert.strictEqual(log.counts.fork, 0);
            });

            test('cluster.on was not called', function () {
                assert.strictEqual(log.counts.on, 0);
            });

            suite('invalid path:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/foo?rt.tstart=1&t_resp=2&t_page=3&t_done=4&r=wibble',
                        method: 'GET',
                        headers: {},
                        socket: {
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                test('response.setHeader was called correctly', function () {
                    assert.strictEqual(log.these.setHeader[0], response);
                    assert.lengthOf(log.args.setHeader[0], 2);
                    assert.strictEqual(log.args.setHeader[0][0], 'Content-Type');
                    assert.strictEqual(log.args.setHeader[0][1], 'application/json');
                });

                test('response.end was called once', function () {
                    assert.strictEqual(log.counts.end, 1);
                });

                test('response.end was called correctly', function () {
                    assert.strictEqual(log.these.end[0], response);
                    assert.lengthOf(log.args.end[0], 1);
                    assert.strictEqual(log.args.end[0][0], '{ "error": "Invalid path `/foo`" }');
                });

                test('response.statusCode was set correctly', function () {
                    assert.strictEqual(response.statusCode, 404);
                });

                test('request.socket.destroy was called once', function () {
                    assert.strictEqual(log.counts.destroy, 1);
                });

                test('request.socket.destroy was called correctly', function () {
                    assert.strictEqual(log.these.destroy[0], request.socket);
                    assert.lengthOf(log.args.destroy[0], 0);
                });
            });

            suite('invalid method:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon?rt.tstart=1&t_resp=2&t_page=3&t_done=4&r=wibble',
                        method: 'PUT',
                        headers: {},
                        socket: {
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                test('response.end was called once', function () {
                    assert.strictEqual(log.counts.end, 1);
                });

                test('response.end was called correctly', function () {
                    assert.strictEqual(log.args.end[0][0], '{ "error": "Invalid method `PUT`" }');
                });

                test('response.statusCode was set correctly', function () {
                    assert.strictEqual(response.statusCode, 405);
                });

                test('request.socket.destroy was called once', function () {
                    assert.strictEqual(log.counts.destroy, 1);
                });
            });

            suite('valid request:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon?rt.tstart=1&t_resp=2&t_page=3&t_done=4&r=wibble',
                        method: 'GET',
                        headers: {
                            referer: 'blah',
                            'user-agent': 'oovavu'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                test('response.setHeader was called correctly', function () {
                    assert.strictEqual(log.these.setHeader[0], response);
                    assert.lengthOf(log.args.setHeader[0], 2);
                    assert.strictEqual(log.args.setHeader[0][0], 'Access-Control-Allow-Origin');
                    assert.strictEqual(log.args.setHeader[0][1], '*');
                });

                test('request.on was called twice', function () {
                    assert.strictEqual(log.counts.on, 2);
                });

                test('request.on was called correctly first time', function () {
                    assert.lengthOf(log.args.on[0], 2);
                    assert.strictEqual(log.args.on[0][0], 'data');
                    assert.isFunction(log.args.on[0][1]);
                });

                test('request.on was called correctly second time', function () {
                    assert.lengthOf(log.args.on[1], 2);
                    assert.strictEqual(log.args.on[1][0], 'end');
                    assert.isFunction(log.args.on[1][1]);
                });

                suite('receive body data:', function () {
                    setup(function () {
                        log.args.on[0][1]('x');
                    });

                    test('response.setHeader was called once', function () {
                        assert.strictEqual(log.counts.setHeader, 2);
                    });

                    test('response.setHeader was called correctly', function () {
                        assert.strictEqual(log.args.setHeader[1][0], 'Content-Type');
                        assert.strictEqual(log.args.setHeader[1][1], 'application/json');
                    });

                    test('response.end was called once', function () {
                        assert.strictEqual(log.counts.end, 1);
                    });

                    test('response.end was called correctly', function () {
                        assert.strictEqual(log.args.end[0][0], '{ "error": "Body too large" }');
                    });

                    test('response.statusCode was set correctly', function () {
                        assert.strictEqual(response.statusCode, 413);
                    });

                    test('request.socket.destroy was called once', function () {
                        assert.strictEqual(log.counts.destroy, 1);
                    });

                    suite('end request:', function () {
                        setup(function () {
                            log.args.on[1][1]();
                        });

                        test('response.end was not called', function () {
                            assert.strictEqual(log.counts.end, 1);
                        });

                        test('request.socket.destroy not called', function () {
                            assert.strictEqual(log.counts.destroy, 1);
                        });
                    });
                });

                suite('end request:', function () {
                    setup(function () {
                        log.args.on[1][1]();
                    });

                    test('mapper was called once', function () {
                        assert.strictEqual(log.counts.mapper, 1);
                    });

                    test('mapper was called correctly', function () {
                        assert.isUndefined(log.these.mapper[0]);
                        assert.lengthOf(log.args.mapper[0], 4);
                        assert.isObject(log.args.mapper[0][0]);
                        assert.isObject(log.args.mapper[0][0].rt);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].rt), 4);
                        assert.strictEqual(log.args.mapper[0][0].rt.url, 'wibble');
                        assert.isObject(log.args.mapper[0][0].rt.timestamps);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].rt.timestamps), 1);
                        assert.strictEqual(log.args.mapper[0][0].rt.timestamps.start, 1);
                        assert.isObject(log.args.mapper[0][0].rt.events);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].rt.events), 0);
                        assert.isObject(log.args.mapper[0][0].rt.durations);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].rt.durations), 3);
                        assert.strictEqual(log.args.mapper[0][0].rt.durations.firstbyte, 2);
                        assert.strictEqual(log.args.mapper[0][0].rt.durations.lastbyte, 5);
                        assert.strictEqual(log.args.mapper[0][0].rt.durations.load, 4);
                        assert.isUndefined(log.args.mapper[0][0].navtiming);
                        assert.isUndefined(log.args.mapper[0][0].restiming);
                        assert.strictEqual(log.args.mapper[0][1], 'blah');
                        assert.strictEqual(log.args.mapper[0][2], 'oovavu');
                        assert.strictEqual(log.args.mapper[0][3], 'foo.bar');
                    });

                    test('forwarder was called once', function () {
                        assert.strictEqual(log.counts.forwarder, 1);
                    });

                    test('forwarder was called correctly', function () {
                        assert.isUndefined(log.these.forwarder[0]);
                        assert.lengthOf(log.args.forwarder[0], 4);
                        assert.strictEqual(log.args.forwarder[0][0], 'default mapped data');
                        assert.isUndefined(log.args.forwarder[0][1]);
                        assert.isUndefined(log.args.forwarder[0][2]);
                        assert.isFunction(log.args.forwarder[0][3]);
                    });

                    test('response.end was not called', function () {
                        assert.strictEqual(log.counts.end, 0);
                    });

                    suite('error:', function () {
                        setup(function () {
                            log.args.forwarder[0][3]('wibble');
                        });

                        test('response.setHeader was called once', function () {
                            assert.strictEqual(log.counts.setHeader, 2);
                        });

                        test('response.setHeader was called correctly', function () {
                            assert.strictEqual(log.args.setHeader[1][0], 'Content-Type');
                            assert.strictEqual(log.args.setHeader[1][1], 'application/json');
                        });

                        test('response.end was called once', function () {
                            assert.strictEqual(log.counts.end, 1);
                        });

                        test('response.end was called correctly', function () {
                            assert.strictEqual(log.args.end[0][0], '{ "error": "wibble" }');
                        });

                        test('response.statusCode was set correctly', function () {
                            assert.strictEqual(response.statusCode, 502);
                        });

                        test('request.socket.destroy was called once', function () {
                            assert.strictEqual(log.counts.destroy, 1);
                        });
                    });

                    suite('success:', function () {
                        setup(function () {
                            log.args.forwarder[0][3](null, 1977);
                        });

                        test('response.setHeader was not called', function () {
                            assert.strictEqual(log.counts.setHeader, 1);
                        });

                        test('response.end was called once', function () {
                            assert.strictEqual(log.counts.end, 1);
                        });

                        test('response.end was called correctly', function () {
                            assert.lengthOf(log.args.end[0], 0);
                        });

                        test('response.statusCode was set correctly', function () {
                            assert.strictEqual(response.statusCode, 204);
                        });

                        test('request.socket.destroy was not called', function () {
                            assert.strictEqual(log.counts.destroy, 0);
                        });
                    });
                });
            });

            suite('invalid query string:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon?rt.tstart=1&t_resp=2&t_page=3&r=wibble&nt_nav_st=10&nt_unload_st=20&nt_unload_end=30&nt_red_st=0&nt_red_end=0&nt_fet_st=40&nt_dns_st=50&nt_dns_end=60&nt_con_st=70&nt_con_end=80&nt_ssl_st=90&nt_req_st=100&nt_res_st=110&nt_res_end=120&nt_domloading=130&nt_domint=140&nt_domcontloaded_st=150&nt_domcontloaded_end=160&nt_domcomp=170&nt_load_st=180&nt_nav_type=foo&nt_red_cnt=0',
                        method: 'GET',
                        headers: {
                            referer: 'wibble',
                            'user-agent': 'blah'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'abc',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                    log.args.on[1][1]();
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was not called', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                test('request.on was called twice', function () {
                    assert.strictEqual(log.counts.on, 2);
                });

                test('mapper was called once', function () {
                    assert.strictEqual(log.counts.mapper, 1);
                });

                test('mapper was called correctly', function () {
                    assert.isUndefined(log.args.mapper[0][0].rt);
                    assert.isUndefined(log.args.mapper[0][0].navtiming);
                    assert.isUndefined(log.args.mapper[0][0].restiming);
                    assert.strictEqual(log.args.mapper[0][1], 'wibble');
                    assert.strictEqual(log.args.mapper[0][2], 'blah');
                    assert.strictEqual(log.args.mapper[0][3], 'abc');
                });

                test('forwarder was called once', function () {
                    assert.strictEqual(log.counts.forwarder, 1);
                });

                test('response.end was not called', function () {
                    assert.strictEqual(log.counts.end, 0);
                });

                test('request.socket.destroy was not called', function () {
                    assert.strictEqual(log.counts.destroy, 0);
                });
            });

            suite('request with navigation timing API parameters:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon?nt_nav_st=10&nt_unload_st=20&nt_unload_end=30&nt_red_st=0&nt_red_end=0&nt_fet_st=40&nt_dns_st=50&nt_dns_end=60&nt_con_st=70&nt_con_end=80&nt_ssl_st=90&nt_req_st=100&nt_res_st=110&nt_res_end=120&nt_domloading=130&nt_domint=140&nt_domcontloaded_st=150&nt_domcontloaded_end=160&nt_domcomp=170&nt_load_st=180&nt_load_end=190&nt_nav_type=foo&nt_red_cnt=0',
                        method: 'GET',
                        headers: {
                            referer: 'wibble',
                            'user-agent': 'blah'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was not called', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                test('request.on was called twice', function () {
                    assert.strictEqual(log.counts.on, 2);
                });

                suite('end request:', function () {
                    setup(function () {
                        log.args.on[1][1]();
                    });

                    test('mapper was called once', function () {
                        assert.strictEqual(log.counts.mapper, 1);
                    });

                    test('mapper was called correctly', function () {
                        assert.isUndefined(log.args.mapper[0][0].rt);

                        assert.isObject(log.args.mapper[0][0].navtiming);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].navtiming), 4);

                        assert.strictEqual(log.args.mapper[0][0].navtiming.type, 'foo');

                        assert.isObject(log.args.mapper[0][0].navtiming.timestamps);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].navtiming.timestamps), 5);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.timestamps.start, 10);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.timestamps.fetchStart, 40);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.timestamps.sslStart, 90);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.timestamps.requestStart, 100);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.timestamps.domInteractive, 140);

                        assert.isObject(log.args.mapper[0][0].navtiming.events);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].navtiming.events), 8);
                        assert.isObject(log.args.mapper[0][0].navtiming.events.unload);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].navtiming.events.unload), 2);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.unload.start, 20);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.unload.end, 30);
                        assert.isObject(log.args.mapper[0][0].navtiming.events.redirect);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.redirect.start, 0);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.redirect.end, 0);
                        assert.isObject(log.args.mapper[0][0].navtiming.events.dns);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.dns.start, 50);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.dns.end, 60);
                        assert.isObject(log.args.mapper[0][0].navtiming.events.connect);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.connect.start, 70);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.connect.end, 80);
                        assert.isObject(log.args.mapper[0][0].navtiming.events.response);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.response.start, 110);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.response.end, 120);
                        assert.isObject(log.args.mapper[0][0].navtiming.events.dom);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.dom.start, 130);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.dom.end, 170);
                        assert.isObject(log.args.mapper[0][0].navtiming.events.domContent);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.domContent.start, 150);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.domContent.end, 160);
                        assert.isObject(log.args.mapper[0][0].navtiming.events.load);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.load.start, 180);
                        assert.strictEqual(log.args.mapper[0][0].navtiming.events.load.end, 190);

                        assert.isObject(log.args.mapper[0][0].navtiming.durations);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].navtiming.durations), 0);

                        assert.isUndefined(log.args.mapper[0][0].restiming);
                    });

                    test('forwarder was called once', function () {
                        assert.strictEqual(log.counts.forwarder, 1);
                    });

                    test('response.end was not called', function () {
                        assert.strictEqual(log.counts.end, 0);
                    });

                    test('request.socket.destroy was not called', function () {
                        assert.strictEqual(log.counts.destroy, 0);
                    });
                });
            });

            suite('request with resource timing API parameters:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon?restiming%5B0%5D%5Brt_name%5D=foo&restiming%5B0%5D%5Brt_in_type%5D=css&restiming%5B0%5D%5Brt_st%5D=30&restiming%5B0%5D%5Brt_dur%5D=40&restiming%5B0%5D%5Brt_red_st%5D=50&restiming%5B0%5D%5Brt_red_end%5D=60&restiming%5B0%5D%5Brt_fet_st%5D=70&restiming%5B0%5D%5Brt_dns_st%5D=80&restiming%5B0%5D%5Brt_dns_end%5D=90&restiming%5B0%5D%5Brt_con_st%5D=100&restiming%5B0%5D%5Brt_con_end%5D=110&restiming%5B0%5D%5Brt_scon_st%5D=120&restiming%5B0%5D%5Brt_req_st%5D=130&restiming%5B0%5D%5Brt_res_st%5D=140&restiming%5B0%5D%5Brt_res_end%5D=150&restiming%5B1%5D%5Brt_name%5D=bar&restiming%5B1%5D%5Brt_in_type%5D=img&restiming%5B1%5D%5Brt_st%5D=160&restiming%5B1%5D%5Brt_dur%5D=170&restiming%5B1%5D%5Brt_red_st%5D=180&restiming%5B1%5D%5Brt_red_end%5D=190&restiming%5B1%5D%5Brt_fet_st%5D=200&restiming%5B1%5D%5Brt_dns_st%5D=210&restiming%5B1%5D%5Brt_dns_end%5D=220&restiming%5B1%5D%5Brt_con_st%5D=230&restiming%5B1%5D%5Brt_con_end%5D=240&restiming%5B1%5D%5Brt_scon_st%5D=250&restiming%5B1%5D%5Brt_req_st%5D=260&restiming%5B1%5D%5Brt_res_st%5D=270&restiming%5B1%5D%5Brt_res_end%5D=280',
                        method: 'GET',
                        headers: {
                            referer: 'wibble',
                            'user-agent': 'blah'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was not called', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                test('request.on was called twice', function () {
                    assert.strictEqual(log.counts.on, 2);
                });

                suite('end request:', function () {
                    setup(function () {
                        log.args.on[1][1]();
                    });

                    test('mapper was called once', function () {
                        assert.strictEqual(log.counts.mapper, 1);
                    });

                    test('mapper was called correctly', function () {
                        assert.isUndefined(log.args.mapper[0][0].rt);
                        assert.isUndefined(log.args.mapper[0][0].navtiming);
                        assert.isArray(log.args.mapper[0][0].restiming);
                        assert.lengthOf(log.args.mapper[0][0].restiming, 2);

                        assert.isObject(log.args.mapper[0][0].restiming[0]);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].restiming[0]), 5);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].name, 'foo');
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].type, 'css');
                        assert.isObject(log.args.mapper[0][0].restiming[0].timestamps);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].restiming[0].timestamps), 4);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].timestamps.start, 30);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].timestamps.fetchStart, 70);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].timestamps.sslStart, 120);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].timestamps.requestStart, 130);
                        assert.isObject(log.args.mapper[0][0].restiming[0].events);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].restiming[0].events), 4);
                        assert.isObject(log.args.mapper[0][0].restiming[0].events.redirect);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].restiming[0].events.redirect), 2);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].events.redirect.start, 50);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].events.redirect.end, 60);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].events.dns.start, 80);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].events.dns.end, 90);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].events.connect.start, 100);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].events.connect.end, 110);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].events.response.start, 140);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].events.response.end, 150);
                        assert.isObject(log.args.mapper[0][0].restiming[0].durations);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].restiming[0].durations), 0);

                        assert.strictEqual(log.args.mapper[0][0].restiming[1].name, 'bar');
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].type, 'img');
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].timestamps.start, 160);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].timestamps.fetchStart, 200);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].timestamps.sslStart, 250);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].timestamps.requestStart, 260);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].events.redirect.start, 180);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].events.redirect.end, 190);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].events.dns.start, 210);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].events.dns.end, 220);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].events.connect.start, 230);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].events.connect.end, 240);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].events.response.start, 270);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].events.response.end, 280);
                    });

                    test('forwarder was called once', function () {
                        assert.strictEqual(log.counts.forwarder, 1);
                    });

                    test('response.end was not called', function () {
                        assert.strictEqual(log.counts.end, 0);
                    });

                    test('request.socket.destroy was not called', function () {
                        assert.strictEqual(log.counts.destroy, 0);
                    });
                });
            });

            suite('request without restricted resource timing API parameters:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon?restiming%5B0%5D%5Brt_name%5D=foo&restiming%5B0%5D%5Brt_in_type%5D=css&restiming%5B0%5D%5Brt_st%5D=20&restiming%5B0%5D%5Brt_dur%5D=30&restiming%5B0%5D%5Brt_fet_st%5D=40&restiming%5B0%5D%5Brt_req_st%5D=50&restiming%5B0%5D%5Brt_res_end%5D=60&restiming%5B1%5D%5Brt_name%5D=bar&restiming%5B1%5D%5Brt_in_type%5D=img&restiming%5B1%5D%5Brt_st%5D=70&restiming%5B1%5D%5Brt_dur%5D=80&restiming%5B1%5D%5Brt_fet_st%5D=90&restiming%5B1%5D%5Brt_req_st%5D=100&restiming%5B1%5D%5Brt_res_end%5D=110',
                        method: 'GET',
                        headers: {
                            referer: 'wibble',
                            'user-agent': 'blah'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                test('request.on was called twice', function () {
                    assert.strictEqual(log.counts.on, 2);
                });

                suite('end request:', function () {
                    setup(function () {
                        log.args.on[1][1]();
                    });

                    test('mapper was called once', function () {
                        assert.strictEqual(log.counts.mapper, 1);
                    });

                    test('mapper was called correctly', function () {
                        assert.isArray(log.args.mapper[0][0].restiming);
                        assert.lengthOf(log.args.mapper[0][0].restiming, 2);

                        assert.strictEqual(log.args.mapper[0][0].restiming[0].name, 'foo');
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].type, 'css');
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].restiming[0].timestamps), 3);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].timestamps.start, 20);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].timestamps.fetchStart, 40);
                        assert.strictEqual(log.args.mapper[0][0].restiming[0].timestamps.requestStart, 50);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].restiming[0].events), 0);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].restiming[0].durations), 0);

                        assert.strictEqual(log.args.mapper[0][0].restiming[1].name, 'bar');
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].type, 'img');
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].restiming[1].timestamps), 3);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].timestamps.start, 70);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].timestamps.fetchStart, 90);
                        assert.strictEqual(log.args.mapper[0][0].restiming[1].timestamps.requestStart, 100);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].restiming[1].events), 0);
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].restiming[1].durations), 0);
                    });

                    test('forwarder was called once', function () {
                        assert.strictEqual(log.counts.forwarder, 1);
                    });

                    test('response.end was not called', function () {
                        assert.strictEqual(log.counts.end, 0);
                    });

                    test('request.socket.destroy was not called', function () {
                        assert.strictEqual(log.counts.destroy, 0);
                    });
                });
            });

            suite('reduced round-trip request:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon?rt.bstart=1000&rt.end=100000',
                        method: 'GET',
                        headers: {
                            referer: 'blah',
                            'user-agent': 'oovavu'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                test('request.on was called twice', function () {
                    assert.strictEqual(log.counts.on, 2);
                });

                suite('end request:', function () {
                    setup(function () {
                        log.args.on[1][1]();
                    });

                    test('mapper was called once', function () {
                        assert.strictEqual(log.counts.mapper, 1);
                    });

                    test('mapper was called correctly', function () {
                        assert.lengthOf(Object.keys(log.args.mapper[0][0].rt), 4);
                        assert.strictEqual(log.args.mapper[0][0].rt.timestamps.start, 1000);
                        assert.strictEqual(log.args.mapper[0][0].rt.durations.load, 99000);
                    });
                });
            });

            suite('application/x-www-form-urlencoded POST request', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon',
                        method: 'POST',
                        headers: {
                            referer: 'wibble',
                            'content-type': 'application/x-www-form-urlencoded',
                            'user-agent': 'blah'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                test('request.on was called twice', function () {
                    assert.strictEqual(log.counts.on, 2);
                });

                suite('receive valid body data:', function () {
                    setup(function () {
                        log.args.on[0][1]('data=t_done%3d1%26r%3Dfoo');
                    });

                    test('response.setHeader was not called', function () {
                        assert.strictEqual(log.counts.setHeader, 1);
                    });

                    suite('end request:', function () {
                        setup(function () {
                            log.args.on[1][1]();
                        });

                        test('mapper was called once', function () {
                            assert.strictEqual(log.counts.mapper, 1);
                        });

                        test('mapper was called correctly', function () {
                            assert.isObject(log.args.mapper[0][0].rt);
                            assert.strictEqual(log.args.mapper[0][0].rt.url, 'foo');
                            assert.isUndefined(log.args.mapper[0][0].rt.timestamps.start);
                            assert.isUndefined(log.args.mapper[0][0].rt.durations.firstbyte);
                            assert.isUndefined(log.args.mapper[0][0].rt.durations.lastbyte);
                            assert.strictEqual(log.args.mapper[0][0].rt.durations.load, 1);
                            assert.isUndefined(log.args.mapper[0][0].navtiming);
                            assert.isUndefined(log.args.mapper[0][0].restiming);
                        });

                        test('forwarder was called once', function () {
                            assert.strictEqual(log.counts.forwarder, 1);
                        });

                        test('response.end was not called', function () {
                            assert.strictEqual(log.counts.end, 0);
                        });

                        test('request.socket.destroy was not called', function () {
                            assert.strictEqual(log.counts.destroy, 0);
                        });

                        suite('success:', function () {
                            setup(function () {
                                log.args.forwarder[0][3](null, 1);
                            });

                            test('response.setHeader was not called', function () {
                                assert.strictEqual(log.counts.setHeader, 1);
                            });

                            test('response.end was called once', function () {
                                assert.strictEqual(log.counts.end, 1);
                            });

                            test('response.statusCode was set correctly', function () {
                                assert.strictEqual(response.statusCode, 200);
                            });

                            test('request.socket.destroy was not called', function () {
                                assert.strictEqual(log.counts.destroy, 0);
                            });
                        });
                    });
                });

                suite('receive invalid body data:', function () {
                    setup(function () {
                        log.args.on[0][1]('data=%7B%22t_done%22%3A10%2C%22r%22%3A%22foo%22%7D');
                    });

                    test('response.setHeader was not called', function () {
                        assert.strictEqual(log.counts.setHeader, 1);
                    });

                    test('response.end was not called', function () {
                        assert.strictEqual(log.counts.end, 0);
                    });

                    test('request.socket.destroy was not called', function () {
                        assert.strictEqual(log.counts.destroy, 0);
                    });

                    suite('end request:', function () {
                        setup(function () {
                            log.args.on[1][1]();
                        });

                        test('mapper was called once', function () {
                            assert.strictEqual(log.counts.mapper, 1);
                        });

                        test('mapper was called correctly', function () {
                            assert.isUndefined(log.args.mapper[0][0].rt);
                            assert.isUndefined(log.args.mapper[0][0].navtiming);
                            assert.isUndefined(log.args.mapper[0][0].restiming);
                        });
                    });
                });
            });

            suite('text/plain POST request', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon',
                        method: 'POST',
                        headers: {
                            referer: 'wibble',
                            'content-type': 'text/plain',
                            'user-agent': 'blah'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                test('request.on was called twice', function () {
                    assert.strictEqual(log.counts.on, 2);
                });

                suite('receive valid body data:', function () {
                    setup(function () {
                        log.args.on[0][1]('data=%7B%22t_done%22%3A10%2C%22r%22%3A%22bar%22%7D');
                    });

                    test('response.setHeader was not called', function () {
                        assert.strictEqual(log.counts.setHeader, 1);
                    });

                    suite('end request:', function () {
                        setup(function () {
                            log.args.on[1][1]();
                        });

                        test('mapper was called once', function () {
                            assert.strictEqual(log.counts.mapper, 1);
                        });

                        test('mapper was called correctly', function () {
                            assert.isObject(log.args.mapper[0][0].rt);
                            assert.strictEqual(log.args.mapper[0][0].rt.url, 'bar');
                            assert.isUndefined(log.args.mapper[0][0].rt.timestamps.start);
                            assert.isUndefined(log.args.mapper[0][0].rt.durations.firstbyte);
                            assert.isUndefined(log.args.mapper[0][0].rt.durations.lastbyte);
                            assert.strictEqual(log.args.mapper[0][0].rt.durations.load, 10);
                            assert.isUndefined(log.args.mapper[0][0].navtiming);
                            assert.isUndefined(log.args.mapper[0][0].restiming);
                        });

                        test('forwarder was called once', function () {
                            assert.strictEqual(log.counts.forwarder, 1);
                        });

                        test('response.end was not called', function () {
                            assert.strictEqual(log.counts.end, 0);
                        });

                        test('request.socket.destroy was not called', function () {
                            assert.strictEqual(log.counts.destroy, 0);
                        });
                    });
                });

                suite('receive invalid body data:', function () {
                    setup(function () {
                        log.args.on[0][1]('data=t_done%3d10');
                    });

                    test('response.setHeader was not called', function () {
                        assert.strictEqual(log.counts.setHeader, 1);
                    });

                    test('response.end was not called', function () {
                        assert.strictEqual(log.counts.end, 0);
                    });

                    test('request.socket.destroy was not called', function () {
                        assert.strictEqual(log.counts.destroy, 0);
                    });

                    suite('end request:', function () {
                        setup(function () {
                            log.args.on[1][1]();
                        });

                        test('mapper was not called', function () {
                            assert.strictEqual(log.counts.mapper, 0);
                        });

                        test('forwarder was not called', function () {
                            assert.strictEqual(log.counts.forwarder, 0);
                        });

                        test('response.setHeader was called once', function () {
                            assert.strictEqual(log.counts.setHeader, 2);
                        });

                        test('response.end was called once', function () {
                            assert.strictEqual(log.counts.end, 1);
                        });

                        test('response.end was called correctly', function () {
                            assert.strictEqual(log.args.end[0][0], '{ "error": "Invalid data" }');
                        });

                        test('response.statusCode was set correctly', function () {
                            assert.strictEqual(response.statusCode, 400);
                        });

                        test('request.socket.destroy was called once', function () {
                            assert.strictEqual(log.counts.destroy, 1);
                        });
                    });
                });
            });

            suite('invalid POST request', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon',
                        method: 'POST',
                        headers: {
                            referer: 'wibble',
                            'content-type': 'application/json'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                test('request.on was not called', function () {
                    assert.strictEqual(log.counts.on, 0);
                });

                test('response.end was called once', function () {
                    assert.strictEqual(log.counts.end, 1);
                });

                test('response.end was called correctly', function () {
                    assert.strictEqual(log.args.end[0][0], '{ "error": "Invalid content type `application/json`" }');
                });

                test('response.statusCode was set correctly', function () {
                    assert.strictEqual(response.statusCode, 415);
                });

                test('request.socket.destroy was called once', function () {
                    assert.strictEqual(log.counts.destroy, 1);
                });
            });

            suite('immediately repeated request:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon?rt.tstart=1&t_resp=2&t_done=3',
                        method: 'GET',
                        headers: {},
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called twice', function () {
                    assert.strictEqual(log.counts.setHeader, 2);
                });

                test('request.socket.destroy was not called', function () {
                    assert.strictEqual(log.counts.destroy, 0);
                });

                test('request.on was called four times', function () {
                    assert.strictEqual(log.counts.on, 4);
                });
            });
        });

        suite('call listen with custom options:', function () {
            setup(function () {
                boomcatch.listen({
                    host: '192.168.1.1',
                    port: 8080,
                    path: '/foo/bar',
                    referer: /baz/,
                    origin: [ 'http://foo', 'http://bar' ],
                    limit: 1000,
                    maxSize: 30,
                    log: {
                        info: spooks.fn({
                            name: 'info',
                            log: log
                        }),
                        error: spooks.fn({
                            name: 'error',
                            log: log
                        })
                    },
                    validator: 'restrictive',
                    filter: 'filtered',
                    mapper: 'mapper',
                    prefix: 'foo prefix',
                    forwarder: 'forwarder',
                    fwdHost: 'bar host',
                    fwdPort: 1234,
                    fwdSize: 256,
                    workers: 2,
                    key: 'test.key',
                    cert: 'test.crt',
                    pfx: 'test.pfx',
                    passphrase: 'testcert',
                    ca: [
                        '-----BEGIN CERTIFICATE-----\
MIIDIDCCAomgAwIBAgIENd70zzANBgkqhkiG9w0BAQUFADBOMQswCQYDVQQGEwJV\
UzEQMA4GA1UEChMHRXF1aWZheDEtMCsGA1UECxMkRXF1aWZheCBTZWN1cmUgQ2Vy\
dGlmaWNhdGUgQXV0aG9yaXR5MB4XDTk4MDgyMjE2NDE1MVoXDTE4MDgyMjE2NDE1\
MVowTjELMAkGA1UEBhMCVVMxEDAOBgNVBAoTB0VxdWlmYXgxLTArBgNVBAsTJEVx\
dWlmYXggU2VjdXJlIENlcnRpZmljYXRlIEF1dGhvcml0eTCBnzANBgkqhkiG9w0B\
AQEFAAOBjQAwgYkCgYEAwV2xWGcIYu6gmi0fCG2RFGiYCh7+2gRvE4RiIcPRfM6f\
BeC4AfBONOziipUEZKzxa1NfBbPLZ4C/QgKO/t0BCezhABRP/PvwDN1Dulsr4R+A\
cJkVV5MW8Q+XarfCaCMczE1ZMKxRHjuvK9buY0V7xdlfUNLjUA86iOe/FP3gx7kC\
AwEAAaOCAQkwggEFMHAGA1UdHwRpMGcwZaBjoGGkXzBdMQswCQYDVQQGEwJVUzEQ\
MA4GA1UEChMHRXF1aWZheDEtMCsGA1UECxMkRXF1aWZheCBTZWN1cmUgQ2VydGlm\
aWNhdGUgQXV0aG9yaXR5MQ0wCwYDVQQDEwRDUkwxMBoGA1UdEAQTMBGBDzIwMTgw\
ODIyMTY0MTUxWjALBgNVHQ8EBAMCAQYwHwYDVR0jBBgwFoAUSOZo+SvSspXXR9gj\
IBBPM5iQn9QwHQYDVR0OBBYEFEjmaPkr0rKV10fYIyAQTzOYkJ/UMAwGA1UdEwQF\
MAMBAf8wGgYJKoZIhvZ9B0EABA0wCxsFVjMuMGMDAgbAMA0GCSqGSIb3DQEBBQUA\
A4GBAFjOKer89961zgK5F7WF0bnj4JXMJTENAKaSbn+2kmOeUJXRmm/kEd5jhW6Y\
7qj/WsjTVbJmcVfewCHrPSqnI0kBBIZCe/zuf6IWUrVnZ9NA2zsmWLIodz2uFHdh\
1voqZiegDfqnc1zqcPGUIWVEX/r87yloqaKHee9570+sB3c4\
-----END CERTIFICATE-----'
                    ],
                    crl: [
                        '-----BEGIN X509 CRL-----\
MIIBxTCBrgIBATANBgkqhkiG9w0BAQUFADB8MRMwEQYKCZImiZPyLGQBGRYDZ292\
MRQwEgYKCZImiZPyLGQBGRYEZm5hbDERMA8GA1UEChMIRmVybWlsYWIxIDAeBgNV\
BAsTF0NlcnRpZmljYXRlIEF1dGhvcml0aWVzMRowGAYDVQQDExFLZXJiZXJpemVk\
IENBIEhTTRcNMTQwNzE0MTcwMDExWhcNMTQwODEzMTcwMDExWjANBgkqhkiG9w0B\
AQUFAAOCAQEAbkMWs+jMY6Mt9o9Y9gK+aJlCq7SNcExkVDgbXy1W8l2+3iTQcwZE\
LcjF7sUADL4+IW2QZLf0+bdMNXnTSEIA40rv02h7PgZttWwv26WKkU/KIRZG+YRL\
CcjPUDlpgRwm7Mox+xlYK9TMLw9SqrL2LfMzsM5UIDV+cWEnbweycrFgv62uEO0f\
06qkpHxDD75ksyp2JKuSQAWYqroIriRnptIB/Y1a3LRJvMbxJIiiwa7V0UVIEvwd\
NpGkV64r06OQqIGXtpI2q0uoGxML0WOp1knvau4Qqq6xKDOrHwjst65jLvrrwEMX\
TWL20RlpV/ePUJ8Q4hFyYch0/bhK6zBByw==\
-----END X509 CRL-----'
                    ],
                    ciphers: 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128:AES256:AES:DES-CBC3-SHA:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK',
                    handshakeTimeout: 1,
                    honorCipherOrder: 1,
                    requestCert: 1,
                    rejectUnauthorized: 1,
                    NPNProtocols: [
                        'http/1.1',
                        'http/1.0'
                    ],
                    SNICallback: function() {
                        return '';
                    },
                    sessionIdContext: '098f6bcd4621d373cade4e832627b4f6',
                    secureProtocol: 'TLSv1_method'
                });
            });

            test('?.initialise was called four times', function () {
                assert.strictEqual(log.counts.initialise, 4);
            });

            test('validator.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[0], require('./validators/restrictive'));
                assert.isObject(log.args.initialise[0][0]);
            });

            test('filter.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[1], require('./filters/filtered'));
                assert.isObject(log.args.initialise[1][0]);
            });

            test('mapper.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[2], require('./mappers/mapper'));
                assert.strictEqual(log.args.initialise[2][0].prefix, 'foo prefix');
            });

            test('forwarder.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[3], require('./forwarders/forwarder'));
                assert.strictEqual(log.args.initialise[3][0].fwdHost, 'bar host');
                assert.strictEqual(log.args.initialise[3][0].fwdPort, 1234);
            });

            test('http.listen was called correctly', function () {
                assert.strictEqual(log.args.listen[0][0], 8080);
                assert.strictEqual(log.args.listen[0][1], '192.168.1.1');
            });

            test('log.info was called once', function () {
                assert.strictEqual(log.counts.info, 1);
            });

            test('log.info was called correctly', function () {
                assert.lengthOf(log.args.info[0], 1);
                assert.strictEqual(log.args.info[0][0], 'listening for 192.168.1.1:8080/foo/bar');
            });

            test('cluster.fork was not called', function () {
                assert.strictEqual(log.counts.fork, 0);
            });

            test('cluster.on was not called', function () {
                assert.strictEqual(log.counts.on, 0);
            });

            suite('valid request:', function () {
                var request, response;

                setup(function () {
                    restrict = false;
                    request = {
                        url: '/foo/bar',
                        method: 'POST',
                        headers: {
                            referer: 'foo.bar.baz.qux',
                            origin: 'http://bar',
                            'content-type': 'application/x-www-form-urlencoded'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                test('response.setHeader was called correctly', function () {
                    assert.strictEqual(log.args.setHeader[0][0], 'Access-Control-Allow-Origin');
                    assert.strictEqual(log.args.setHeader[0][1], 'http://bar');
                });

                test('request.socket.destroy was not called', function () {
                    assert.strictEqual(log.counts.destroy, 0);
                });

                test('log.info was called once', function () {
                    assert.strictEqual(log.counts.info, 2);
                });

                test('log.info was called correctly', function () {
                    assert.strictEqual(log.args.info[1][0], 'referer=foo.bar.baz.qux address=foo.bar[] method=POST url=/foo/bar');
                });

                test('request.on was called twice', function () {
                    assert.strictEqual(log.counts.on, 2);
                });

                suite('receive valid body data:', function () {
                    setup(function () {
                        log.args.on[0][1]('data=t_done%3D100%26r%3D');
                    });

                    test('response.setHeader was not called', function () {
                        assert.strictEqual(log.counts.setHeader, 1);
                    });

                    suite('end request:', function () {
                        setup(function () {
                            log.args.on[1][1]();
                        });

                        test('validator was called once', function () {
                            assert.strictEqual(log.counts.validator, 1);
                        });

                        test('validator was called correctly', function () {
                            assert.isObject(log.args.validator[0][0]);
                            assert.lengthOf(Object.keys(log.args.validator[0][0]), 2);
                            assert.strictEqual(log.args.validator[0][0].r, '');
                            assert.strictEqual(log.args.validator[0][0].t_done, '100');
                        });

                        test('filter was called once', function () {
                            assert.strictEqual(log.counts.filter, 1);
                        });

                        test('filter was called correctly', function () {
                            assert.isObject(log.args.filter[0][0]);
                            assert.isObject(log.args.filter[0][0].rt);
                            assert.strictEqual(log.args.filter[0][0].rt.url, '');
                            assert.strictEqual(log.args.filter[0][0].rt.durations.load, 100);
                        });

                        test('mapper was called once', function () {
                            assert.strictEqual(log.counts.mapper, 1);
                        });

                        test('mapper was called correctly', function () {
                            assert.isObject(log.args.mapper[0][0]);
                            assert.lengthOf(Object.keys(log.args.mapper[0][0]), 0);
                        });

                        test('forwarder was called once', function () {
                            assert.strictEqual(log.counts.forwarder, 1);
                        });

                        test('forwarder was called correctly', function () {
                            assert.strictEqual(log.args.forwarder[0][0], 'alternative mapped data');
                        });

                        test('response.end was not called', function () {
                            assert.strictEqual(log.counts.end, 0);
                        });

                        test('request.socket.destroy was not called', function () {
                            assert.strictEqual(log.counts.destroy, 0);
                        });
                    });
                });

                suite('receive too much body data:', function () {
                    setup(function () {
                        log.args.on[0][1]('data=t_done%3D100%26r%3Dwibbley');
                    });

                    test('response.setHeader was called once', function () {
                        assert.strictEqual(log.counts.setHeader, 2);
                    });

                    test('response.end was called once', function () {
                        assert.strictEqual(log.counts.end, 1);
                    });

                    test('response.end was called correctly', function () {
                        assert.strictEqual(log.args.end[0][0], '{ "error": "Body too large" }');
                    });

                    test('response.statusCode was set correctly', function () {
                        assert.strictEqual(response.statusCode, 413);
                    });

                    test('request.socket.destroy was called once', function () {
                        assert.strictEqual(log.counts.destroy, 1);
                    });
                });
            });

            suite('valid request without referer:', function () {
                var request, response;

                setup(function () {
                    restrict = false;
                    request = {
                        url: '/foo/bar?rt.tstart=1&t_resp=2&t_done=3',
                        method: 'GET',
                        headers: {},
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                test('request.socket.destroy was not called', function () {
                    assert.strictEqual(log.counts.destroy, 0);
                });

                test('request.on was called twice', function () {
                    assert.strictEqual(log.counts.on, 2);
                });
            });

            suite('invalid referer:', function () {
                var request, response;

                setup(function () {
                    restrict = false;
                    request = {
                        url: '/foo/bar?rt.tstart=1&t_resp=2&t_done=3',
                        method: 'GET',
                        headers: {
                            referer: 'foo.bar.bz.qux'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                test('response.end was called once', function () {
                    assert.strictEqual(log.counts.end, 1);
                });

                test('response.end was called correctly', function () {
                    assert.strictEqual(log.args.end[0][0], '{ "error": "Invalid referer `foo.bar.bz.qux`" }');
                });

                test('response.statusCode was set correctly', function () {
                    assert.strictEqual(response.statusCode, 403);
                });

                test('request.socket.destroy was called once', function () {
                    assert.strictEqual(log.counts.destroy, 1);
                });

                test('request.on was not called', function () {
                    assert.strictEqual(log.counts.on, 0);
                });
            });

            suite('immediately repeated request:', function () {
                var request, response;

                setup(function () {
                    restrict = false;
                    request = {
                        url: '/foo/bar?rt.tstart=1&t_resp=2&t_done=3',
                        method: 'GET',
                        headers: {
                            referer: 'baz'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called twice', function () {
                    assert.strictEqual(log.counts.setHeader, 2);
                });

                test('response.end was called once', function () {
                    assert.strictEqual(log.counts.end, 1);
                });

                test('response.end was called correctly', function () {
                    assert.strictEqual(log.args.end[0][0], '{ "error": "Exceeded rate `1000`" }');
                });

                test('response.statusCode was set correctly', function () {
                    assert.strictEqual(response.statusCode, 429);
                });

                test('request.socket.destroy was called once', function () {
                    assert.strictEqual(log.counts.destroy, 1);
                });

                test('request.on was not called', function () {
                    assert.strictEqual(log.counts.on, 2);
                });
            });

            suite('immediate request from different address:', function () {
                var request, response;

                setup(function () {
                    restrict = false;
                    request = {
                        url: '/foo/bar?rt.tstart=1&t_resp=2&t_done=3',
                        method: 'GET',
                        headers: {
                            referer: 'baz'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                    request.socket.remoteAddress = 'wibble';
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called twice', function () {
                    assert.strictEqual(log.counts.setHeader, 2);
                });

                test('request.socket.destroy was not called', function () {
                    assert.strictEqual(log.counts.destroy, 0);
                });

                test('request.on was called four times', function () {
                    assert.strictEqual(log.counts.on, 4);
                });
            });

            suite('immediate request from different proxied address:', function () {
                var request, response;

                setup(function () {
                    restrict = false;
                    request = {
                        url: '/foo/bar?rt.tstart=1&t_resp=2&t_done=3',
                        method: 'GET',
                        headers: {
                            referer: 'baz'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    request.headers['x-forwarded-for'] = 'wibble';
                    log.args.createServer[0][0](request, response);
                    request.headers['x-forwarded-for'] = 'wobble';
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called twice', function () {
                    assert.strictEqual(log.counts.setHeader, 2);
                });

                test('request.socket.destroy was not called', function () {
                    assert.strictEqual(log.counts.destroy, 0);
                });

                test('request.on was called four times', function () {
                    assert.strictEqual(log.counts.on, 4);
                });
            });

            suite('immediate request from same proxied address:', function () {
                var request, response;

                setup(function () {
                    restrict = false;
                    request = {
                        url: '/foo/bar?rt.tstart=1&t_resp=2&t_done=3',
                        method: 'GET',
                        headers: {
                            referer: 'baz'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    request.headers['x-forwarded-for'] = 'wibble';
                    log.args.createServer[0][0](request, response);
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called twice', function () {
                    assert.strictEqual(log.counts.setHeader, 2);
                });

                test('response.end was called once', function () {
                    assert.strictEqual(log.counts.end, 1);
                });

                test('response.statusCode was set correctly', function () {
                    assert.strictEqual(response.statusCode, 429);
                });

                test('request.socket.destroy was called once', function () {
                    assert.strictEqual(log.counts.destroy, 1);
                });

                test('request.on was not called', function () {
                    assert.strictEqual(log.counts.on, 2);
                });
            });

            suite('immediate request from first proxied address:', function () {
                var request, response;

                setup(function () {
                    restrict = false;
                    request = {
                        url: '/foo/bar?rt.tstart=1&t_resp=2&t_done=3',
                        method: 'GET',
                        headers: {
                            referer: 'baz'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                    request.headers['x-forwarded-for'] = 'wibble';
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called twice', function () {
                    assert.strictEqual(log.counts.setHeader, 2);
                });

                test('request.socket.destroy was not called', function () {
                    assert.strictEqual(log.counts.destroy, 0);
                });

                test('request.on was called four times', function () {
                    assert.strictEqual(log.counts.on, 4);
                });
            });

            suite('immediate request from first unproxied address:', function () {
                var request, response;

                setup(function () {
                    restrict = false;
                    request = {
                        url: '/foo/bar?rt.tstart=1&t_resp=2&t_done=3',
                        method: 'GET',
                        headers: {
                            referer: 'baz'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    request.headers['x-forwarded-for'] = 'wibble';
                    log.args.createServer[0][0](request, response);
                    request.headers['x-forwarded-for'] = null;
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called twice', function () {
                    assert.strictEqual(log.counts.setHeader, 2);
                });

                test('request.socket.destroy was not called', function () {
                    assert.strictEqual(log.counts.destroy, 0);
                });

                test('request.on was called four times', function () {
                    assert.strictEqual(log.counts.on, 4);
                });
            });

            suite('later repeated request', function () {
                var request, response;

                setup(function () {
                    restrict = false;
                    request = {
                        url: '/foo/bar?rt.tstart=1&t_resp=2&t_done=3',
                        method: 'GET',
                        headers: {
                            referer: 'baz'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                    request.socket.remoteAddress = 'baz';
                    log.args.createServer[0][0](request, response);
                    request.socket.remoteAddress = 'foo.bar';
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called three times', function () {
                    assert.strictEqual(log.counts.setHeader, 3);
                });

                test('response.end was called once', function () {
                    assert.strictEqual(log.counts.end, 1);
                });

                test('response.statusCode was set correctly', function () {
                    assert.strictEqual(response.statusCode, 429);
                });

                test('request.socket.destroy was called once', function () {
                    assert.strictEqual(log.counts.destroy, 1);
                });

                test('request.on was not called', function () {
                    assert.strictEqual(log.counts.on, 4);
                });
            });

            suite('later request from same proxied address:', function () {
                var request, response;

                setup(function () {
                    restrict = false;
                    request = {
                        url: '/foo/bar?rt.tstart=1&t_resp=2&t_done=3',
                        method: 'GET',
                        headers: {
                            referer: 'baz'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    request.headers['x-forwarded-for'] = 'wibble';
                    log.args.createServer[0][0](request, response);
                    request.headers['x-forwarded-for'] = 'wobble';
                    log.args.createServer[0][0](request, response);
                    request.headers['x-forwarded-for'] = 'wubble';
                    log.args.createServer[0][0](request, response);
                    request.headers['x-forwarded-for'] = 'wibble';
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called four times', function () {
                    assert.strictEqual(log.counts.setHeader, 4);
                });

                test('response.end was called once', function () {
                    assert.strictEqual(log.counts.end, 1);
                });

                test('response.statusCode was set correctly', function () {
                    assert.strictEqual(response.statusCode, 429);
                });

                test('request.socket.destroy was called once', function () {
                    assert.strictEqual(log.counts.destroy, 1);
                });

                test('request.on was not called', function () {
                    assert.strictEqual(log.counts.on, 6);
                });
            });

            suite('invalid request:', function () {
                var request, response;

                setup(function () {
                    restrict = true;
                    request = {
                        url: '/foo/bar?rt.tstart=1&t_resp=2&t_done=3',
                        method: 'GET',
                        headers: {
                            referer: 'foo.bar.baz.qux'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                    log.args.on[1][1]();
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('request.on was called twice', function () {
                    assert.strictEqual(log.counts.on, 2);
                });

                test('response.setHeader was called twice', function () {
                    assert.strictEqual(log.counts.setHeader, 2);
                });

                test('response.end was called once', function () {
                    assert.strictEqual(log.counts.end, 1);
                });

                test('response.end was called correctly', function () {
                    assert.strictEqual(log.args.end[0][0], '{ "error": "Invalid data" }');
                });

                test('response.statusCode was set correctly', function () {
                    assert.strictEqual(response.statusCode, 400);
                });

                test('request.socket.destroy was called once', function () {
                    assert.strictEqual(log.counts.destroy, 1);
                });
            });
        });

        suite('call listen with failing mapper:', function () {
            setup(function () {
                boomcatch.listen({ mapper: 'failing' });
            });

            test('?.initialise was called four times', function () {
                assert.strictEqual(log.counts.initialise, 4);
            });

            test('mapper.initialise was called correctly', function () {
                assert.strictEqual(log.these.initialise[2], require('./mappers/failing'));
            });

            suite('valid request:', function () {
                var request, response;

                setup(function () {
                    request = {
                        url: '/beacon?t_done=1',
                        method: 'GET',
                        headers: {
                            referer: 'blah'
                        },
                        on: spooks.fn({
                            name: 'on',
                            log: log
                        }),
                        socket: {
                            remoteAddress: 'foo.bar',
                            destroy: spooks.fn({
                                name: 'destroy',
                                log: log
                            })
                        }
                    };
                    response = spooks.obj({
                        archetype: { setHeader: nop, end: nop },
                        log: log
                    });
                    log.args.createServer[0][0](request, response);
                });

                teardown(function () {
                    request = response = undefined;
                });

                test('response.setHeader was called once', function () {
                    assert.strictEqual(log.counts.setHeader, 1);
                });

                suite('end request:', function () {
                    setup(function () {
                        log.args.on[1][1]();
                    });

                    test('mapper was called once', function () {
                        assert.strictEqual(log.counts.mapper, 1);
                    });

                    test('forwarder was not called', function () {
                        assert.strictEqual(log.counts.forwarder, 0);
                    });

                    test('response.setHeader was called once', function () {
                        assert.strictEqual(log.counts.setHeader, 2);
                    });

                    test('response.end was called once', function () {
                        assert.strictEqual(log.counts.end, 1);
                    });

                    test('response.end was called correctly', function () {
                        assert.strictEqual(log.args.end[0][0], '{ "error": "Invalid data" }');
                    });

                    test('response.statusCode was set correctly', function () {
                        assert.strictEqual(response.statusCode, 400);
                    });

                    test('request.socket.destroy was called once', function () {
                        assert.strictEqual(log.counts.destroy, 1);
                    });
                });
            });
        });

        suite('call listen with cluster master:', function () {
            setup(function () {
                cluster.isMaster = true;

                boomcatch.listen({
                    workers: 2
                });
            });

            teardown(function () {
                cluster.isMaster = undefined;
            });

            test('?.initialise was not called', function () {
                assert.strictEqual(log.counts.initialise, 0);
            });

            test('http.createServer was not called', function () {
                assert.strictEqual(log.counts.createServer, 0);
            });

            test('http.listen was not called', function () {
                assert.strictEqual(log.counts.listen, 0);
            });

            test('cluster.fork was called twice', function () {
                assert.strictEqual(log.counts.fork, 2);
            });

            test('cluster.fork was called correctly first time', function () {
                assert.strictEqual(log.these.fork[0], cluster);
                assert.lengthOf(log.args.fork[0], 0);
            });

            test('cluster.fork was called correctly second time', function () {
                assert.strictEqual(log.these.fork[1], cluster);
                assert.lengthOf(log.args.fork[1], 0);
            });

            test('cluster.on was called twice', function () {
                assert.strictEqual(log.counts.on, 2);
            });

            test('cluster.on was called correctly first time', function () {
                assert.strictEqual(log.these.on[0], cluster);
                assert.lengthOf(log.args.on[0], 2);
                assert.strictEqual(log.args.on[0][0], 'online');
                assert.isFunction(log.args.on[0][1]);
            });

            test('cluster.on was called correctly second time', function () {
                assert.strictEqual(log.these.on[1], cluster);
                assert.lengthOf(log.args.on[1], 2);
                assert.strictEqual(log.args.on[1][0], 'exit');
                assert.isFunction(log.args.on[1][1]);
                assert.notEqual(log.args.on[0][1], log.args.on[1][1]);
            });

            suite('exit worker:', function () {
                var worker;

                setup(function () {
                    worker = {
                        process: {
                            pid: 19770610
                        }
                    };
                    log.args.on[1][1](worker);
                });

                teardown(function () {
                    worker = undefined;
                });

                test('cluster.fork was called once', function () {
                    assert.strictEqual(log.counts.fork, 3);
                });

                test('cluster.fork was called correctly', function () {
                    assert.strictEqual(log.these.fork[2], cluster);
                    assert.lengthOf(log.args.fork[2], 0);
                });
            });
        });
    });
});

