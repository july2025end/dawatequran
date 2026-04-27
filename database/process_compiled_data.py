import csv
import json
import io

csv_data = """S1,S2,UC,Sector,Name,Remarks/Status,Phone
1,1,81,G-9/3 Karachi Company,Jawad Saleem,"Active, attends member meetings, provides contribution, takes no responsibility",923225006262
2,2,81,G-9/3 Karachi Company,Hassan-al-Banna,Inactive,923366645919
3,3,81,G-9/3 Karachi Company,Rashid Hussain,-,923335356653
4,4,81,G-9/3 Karachi Company,Rana Waseem Aslam,"Provides contribution. Does not attend member meetings, no responsibility held",923335556245
5,5,81,G-9/3 Karachi Company,Rao Javed Akhtar,"Provides contribution, attends UC member meetings. Residency has shifted to G-13. Only active in elections and trade politics",923218563605
6,6,81,G-9/3 Karachi Company,Syed Taha Arif,Inactive,923322505085
7,7,81,G-9/3 Karachi Company,Abdul Rab Khan,"Highly inactive, neither wants to see the contact, nor wants anyone to meet him",923008569504
8,8,81,G-9/3 Karachi Company,Auf Abdul Rahman,Provides contribution. Otherwise inactive,92332237249
9,9,81,G-9/3 Karachi Company,Ghulam Mustafa,Active,923445844503
10,10,81,G-9/3 Karachi Company,Muhammad Akhtar Abbas,Active - Nazim Bait-ul-Maal,923017746424
11,11,81,G-9/3 Karachi Company,Muhammad Anwar Khawaja,Active,923005287546
12,12,81,G-9/3 Karachi Company,Muhammad Rashid,Nazim UC,923316378566
13,13,81,G-9/3 Karachi Company,Muhammad Saleem Chaudhry,Disabled,923005382677
14,1,82,G-9/2,Tajammul Hussain,-,923215018198
15,2,82,G-9/2,Raja Tanveer-ul-Hassan,-,923455238498
16,3,82,G-9/2,Rizwan Aziz,-,923215534492
17,4,82,G-9/2,Sarwar Hassan Khan,-,923065078797
18,5,82,G-9/2,Shafqat Saleem,-,923335289687
19,6,82,G-9/2,Abdul Subhan,Nazim UC,923345328863
20,7,82,G-9/2,Abdul Samad,-,923109064070
21,8,82,G-9/2,Mubarak Ahmed,-,923025211231
22,1,83,G-9/4,Ikhtiyar Ahmed Qureshi,-,923005117811
24,2,83,G-9/4,Azhar Baloch,Nazim UC,923335152913
25,3,83,G-9/4,Badr-ul-Islam,-,923345095544
26,4,83,G-9/4,Chaudhry Muhammad Iqbal,-,923345324944
27,5,83,G-9/4,Hafiz Khizar Hayat,-,923009708853
28,6,83,G-9/4,Rana Istikhar Ahmed Khan,-,923335141121
29,7,83,G-9/4,Shahid Imran Gondal,-,923005808040
30,8,83,G-9/4,Tahir Chaudhry,-,923005800503
31,9,83,G-9/4,Muhammad Zareen Qureshi,-,923008505501
32,10,83,G-9/4,Muhammad Abdul Basit,-,923355868598
33,11,83,G-9/4,Muhammad Mansoor,-,923379851906
34,1,84,G-10/2-3,Osama Farooqui,Saudi Arabia,923018561064
35,2,84,G-10/2-3,Dr. Sajid Khakwani,1-16 in Jan-26,923475145000
36,3,84,G-10/2-3,Safeer Ahmed Mughal,Nazim UC,923008270709
37,4,84,G-10/2-3,Ghulam Sarwar Shakir,-,923008563212
38,5,84,G-10/2-3,Ghulam Mustafa,-,923136293655
39,6,84,G-10/2-3,Muhammad Asim Nadeem,-,923215841241
40,7,84,G-10/2-3,Muhammad Mohtasim Khakwani,1-16 in Jan-26,923125059154
41,8,84,G-10/2-3,Muzammil Sarwar,-,923215272334
42,9,84,G-10/2-3,Musaib Khakwani,1-14,923355078885
43,10,84,G-10/2-3,Maaz Siddiqui,-,923175853656
44,11,84,G-10/2-3,Yusuf Ghazi,-,923445175289
45,1,85,G-10/1-4,Ehsanullah Qureshi,-,923008556689
46,2,85,G-10/1-4,Irtiza Haider,-,923225123876
47,3,85,G-10/1-4,Chaudhry Muhammad Siddique,-,3350351969 / 3125006070
48,4,85,G-10/1-4,Hafiz Farmanullah,-,923155255824
49,5,85,G-10/1-4,Dr. Haris Shumar,-,923435096163
50,6,85,G-10/1-4,Dr. Tahir Farooq,-,923175853656
51,7,85,G-10/1-4,Sardar Shabbir Ahmed,-,923445219944
52,8,85,G-10/1-4,Saad Hameed,-,923108817179
53,9,85,G-10/1-4,Syed Taqweem-ul-Haq,-,923028537620
54,10,85,G-10/1-4,Syed Saif-ul-Islam,-,923335226446
55,11,85,G-10/1-4,Syed Abdullah Rizvi,Germany,923345461320
56,12,85,G-10/1-4,Abdul Rahman,USA,923314343558
57,13,85,G-10/1-4,Abdul Rahman Tariq Butt,Switzerland,923012215033
58,14,85,G-10/1-4,Abdul Samad,-,923325494272
59,15,85,G-10/1-4,Abdul Quddus Qureshi,-,923324833364
60,16,85,G-10/1-4,Abdullah Sarfraz,-,923355527165
61,17,85,G-10/1-4,Ata-ur-Rahman,-,923008555153
62,18,85,G-10/1-4,Ataullah,-,923400940531
63,19,85,G-10/1-4,Umair Hassan Ghazi,-,923005559652
64,20,85,G-10/1-4,Ghulam Mustafa,-,923019793300
65,21,85,G-10/1-4,Fazl-e-Elahi,-,920512350813
66,22,85,G-10/1-4,Muhammad Ibrahim Alvi,-,920512213247
67,23,85,G-10/1-4,Muhammad Aslam,-,923225008320
68,24,85,G-10/1-4,Muhammad Rashid Umar Olikh,-,923327617540
69,25,85,G-10/1-4,Muhammad Mehdi Khan,Disabled,-
70,26,85,G-10/1-4,-,-,923145262303
71,27,85,G-10/1-4,Mukhtar Ahmed Bhatti,-,923335120751
72,28,85,G-10/1-4,Murad Ali,-,923003353736
73,29,85,G-10/1-4,Nadeem Ahmed Subhani,Nazim UC,923008270709
74,30,85,G-10/1-4,Naeem Ahmed Subhani,-,923008522113
75,1,86,G-11/2,Allah Ditta,-,923005644104
76,2,86,G-11/2,Toufeeq Ahmed,-,923004203133
77,3,86,G-11/2,Chaudhry Fateh Khan,-,923215020802
78,4,86,G-11/2,Hafiz Bakht Ali,-,923005395004
79,5,86,G-11/2,Khalid Hayat,-,923313205550
80,6,86,G-11/2,Khalil-ur-Rahman Chishti,-,923005560900
81,7,86,G-11/2,Shabbir Ahmed,-,923002026464
82,8,86,G-11/2,Farid Brohi,-,923332386693
83,9,86,G-11/2,Muhammad Osama,-,923135356868
84,10,86,G-11/2,Muhammad Asad,-,923136333822
85,11,86,G-11/2,Maulana Noor Hayat,-,923335379343
86,12,86,G-11/1-2,Chaudhry Asghar Ali,Disabled,923235160037
87,13,86,G-11/1-2,Hafiz Waseem Jwal,No contact,923215388137
88,14,86,G-11/1-2,(Name unclear),Member Aug '25,923005170981
89,15,86,G-11/1-2,Sagheer Ahmed Bhatti,Member Aug '25,923355564448
90,16,86,G-11/1-2,Abdul Habib,-,923118455342
91,17,86,G-11/1-2,Adnan Bin Junaid,No contact,923005196596
92,18,86,G-11/1-2,Adnan Ali Shah,Qaim UC,923368377067
93,19,86,G-11/1-2,Fawad Ahmed,Inactive,923353727003
94,20,86,G-11/1-2,Kamran Ali Shah,UK,923215223292
95,21,86,G-11/1-2,Muhammad Zia-ur-Rahman,Nazim UC,923315418491
96,22,86,G-11/1-2,Mushtaq Ahmed,Nazim Maliyat,923008555441
97,23,86,G-11/1-2,Malik Abdul Rahman,Disabled,923455093077
98,1,87,G-11/3,Hafiz Abdul Ghaffar Nadeem,-,923315444406
99,2,87,G-11/3,Syed Bilal,-,923008541116
100,3,87,G-11/3,Adnan Bin Abdullah,-,923335160119
101,4,87,G-11/3,Qanat Khalil,-,923344449999
102,5,87,G-11/3,Muhammad Zafarullah Khan,-,923335198469
103,6,87,G-11/3,Muhammad Asim,-,923061793791
104,7,87,G-11/3,Muhammad Niaz,-,923336488978
105,8,87,G-11/4,Syed Saeed-ur-Rahman,-,923331443575
106,9,87,G-11/4,Syed Mahmood Ahmed,Nazim Circle,923219595369
107,10,87,G-11/4,Shabbir Hussain,Nazim UC,923125597792
108,11,87,G-11/4,Zaheer Ahmed,Nazim UC,923365573767
109,12,87,G-11/4,Muhammad Tayyab Siddiqui,-,923008593979
110,13,87,G-11/4,Ghaib-ur-Rahman Chughtai,Shifted from Wah,923006099644
111,1,88,H-8,Abu Bakr Qureshi,Shifted from H-13,923336824250
112,2,88,H-8,Imran Bukhari,-,923005138371
113,3,88,"I-8/2-3, H-8",Asad Ali Mughal,-,923015107273
114,4,88,"I-8/2-3, H-8",Altaf Sher,Sadr Al-Khidmat,923018551478
115,5,88,"I-8/2-3, H-8",Saqib Riaz,Shifted from Zone 1,923038100754
116,6,88,"I-8/2-3, H-8",Istair,-,923232610815
117,7,88,"I-8/2-3, H-8",Syed Tariq Nehri,-,923335670001
118,8,88,"I-8/2-3, H-8",Shams-ul-Islam Abbasi,Imam Masjid Al-Furqan,923455236663
119,9,88,"I-8/2-3, H-8",Shams-ul-Haq,-,923335644466
120,10,88,"I-8/2-3, H-8",Aamir Nadeem,-,923315496034
121,11,88,"I-8/2-3, H-8",Umar Mahmood Wattoo,-,923348377443
122,12,88,"I-8/2-3, H-8",Farooq Khan,-,923335635676
123,13,88,"I-8/2-3, H-8",Farhan-ul-Haq,-,923349540954
124,14,88,"I-8/2-3, H-8",Qazi Israel,Khateeb Masjid Al-Furqan,923215066837
125,15,88,"I-8/2-3, H-8",Muhammad Zubair Siddiqui,-,923029200212
126,16,88,"I-8/2-3, H-8",Muhammad Mudassar Sarwar,-,923455199377
127,17,88,"I-8/2-3, H-8",Muhammad Yunus Shakir,-,923365347416
128,18,88,"I-8/2-3, H-8",Maulana Khalid Hussain,-,923315001275
129,19,88,"I-8/2-3, H-8",Najeeb Abbasi,Nazim UC,923005009351
130,1,88,I-8/1-4,Asrar Ahmed,-,923338189033
131,2,89,I-8/1-4,Anjum Raheel,-,923455088000
132,3,89,I-8/1-4,M. Arif Bhatti,-,923335163671
133,4,89,I-8/1-4,Prof. Dr. Waseem Ahmed Khan,-,923335227389
134,5,89,I-8/1-4,Javed Akhtar Chaudhry,-,923331560956
135,6,89,I-8/1-4,Dr. Hussain-ul-Ilmi,-,923005277205
136,7,89,I-8/1-4,Rana Ijaz,-,923335259650
137,8,89,I-8/1-4,Saadan Yusuf,-,923341059509
138,9,89,I-8/1-4,Sikandar Hayat,-,923118055508
139,10,89,I-8/1-4,Shakeel Ahmed,-,923035363042
140,11,89,I-8/1-4,Zafar-ul-Islam Chaudhry,-,923225130428
141,12,89,I-8/1-4,Faizan-ul-Jam,UK,923215212115
142,13,89,I-8/1-4,Mateen Ahmed Farooqui,-,923004816074
143,14,89,I-8/1-4,Muhammad Iqbal Mirza,-,923015161012
144,15,89,I-8/1-4,Muhammad Saftain,-,923339898135
145,16,89,I-8/1-4,Muhammad Asim Rabbani,-,923315152502
146,17,89,I-8/1-4,Muhammad Qayyum Johar,-,923345450677
147,18,89,I-8/1-4,Noor Zaman,Nazim UC,923335685268
148,19,89,I-8/1-4,Haroon Rashid,-,923421114206
149,1,90A,I-9/4,Abu Anas - Amjad,-,923005150860
150,2,90A,I-9/4,Ehsan-ul-Haq,Nazim UC,923025761075
151,3,90A,I-9/4,Ahsan Qaseem Abbasi,-,923009700050
152,4,90A,I-9/4,Amjad Ali Arabi,-,923009711409
153,5,90A,I-9/4,Aftab Ahmed,-,923235278594
154,6,90A,I-9/4,Shah Farooq,-,923465356587
155,7,90A,I-9/4,Abdul Latif,-,923315186699
156,8,90A,I-9/4,Ataullah Baloch,-,923215347181
157,9,90A,I-9/4,Liaquat Ali,-,923365248127
158,10,90A,I-9/4,Muhammad Rabbani,-,923322564513
159,11,90A,I-9/4,Muhammad Imran Raja,-,923325219021
160,12,90A,I-9/4,Muhammad Mashooq,-,923005336439
161,13,90A,I-9/4,Nabi Bakhsh,-,923005582607
162,14,90A,I-9/4,Nafees-ul-Hassan,-,923325582870
163,15,90A,I-9/4,Noor Badshah,-,923345401080
164,1,90B,"I-9/1-2-3, H-9",Ashfaq Ahmed,Nazim UC,923216351590
165,2,90B,"I-9/1-2-3, H-9",-,-,923084340712
166,3,90B,"I-9/1-2-3, H-9",Amir Usman Ghani,-,923337002873
167,4,90B,"I-9/1-2-3, H-9",Owais Ahmed,-,923136351590
168,5,90B,"I-9/1-2-3, H-9",Aftab Ahmed,-,923465342252
169,6,90B,"I-9/1-2-3, H-9",Haris Abdullah,-,923332224917
170,7,90B,"I-9/1-2-3, H-9",Hafiz Abdul Rahman,-,923368791248
171,8,90B,"I-9/1-2-3, H-9",Ghulam Qadir,Moved from Balochistan,923365248127
172,9,90B,"I-9/1-2-3, H-9",Col. Khalid Mahmood Abbasi,Nazim Circle,923018546915
173,10,90B,"I-9/1-2-3, H-9",Muhammad Aslam Javed,-,923335565255
174,11,90B,"I-9/1-2-3, H-9",Muhammad Zia-ul-Haq,-,923005106773
175,12,90B,"I-9/1-2-3, H-9",Talha Tariq,-,923156535737
176,13,90B,"I-9/1-2-3, H-9",Mir Akbar Shah,-,923333739707
177,14,90B,"I-9/1-2-3, H-9",Waqar Ahmed,-,923325174964
178,1,91,I-10/4,Ilyas,1-10/4 H 694 St 101,923345123229
179,2,91,I-10/4,Nawaz,-,923465226629
180,3,91,I-10/4,Aziz Imam,-,923365522673
181,4,91,I-10/4,Anas Zubair,Nazim UC,923315044580
182,5,91,I-10/4,Ehtesham Butt,From Mirpur Sindh,923342128496
183,6,91,I-10/4,Chaudhry Shahid Ajmal,Shift him to this UC,923335390983
184,7,91,I-10/4,Khaliq Dad Khan,-,923215824088
185,8,91,I-10/4,Dr. Muhammad Shams Chaudhry,-,923009737119
186,9,91,I-10/4,Rahmatullah Arshad,-,923325515592
187,11,91,I-10/4,Tashkeel Mirza,-,923009821487
188,12,91,I-10/4,Sher Muhammad Khan Advocate,-,923469024717
189,13,91,I-10/4,Tariq Malik,-,923335389460
190,14,91,I-10/4,Abdul Rahman,-,923476867958
191,15,91,I-10/4,Aziz Wahid,-,923028182062
192,16,91,I-10/4,Inayatullah,Nazim Circle,923102346205
193,17,91,I-10/4,Muhammad Khalid Umar Olikh,-,923347633529
194,18,91,I-10/4,Muhammad Rafiq Tahir,-,923340633633
195,19,91,I-10/4,Mushtaq Ahmed,-,923028505988
196,20,91,I-10/4,Malik Muhammad Siddique,-,923125239876
197,21,91,I-10/4,Mir Afsar Aman,-,923213897328
198,10,91,I-10/4,Sardar Nazar Hussain,-,920514445757
199,22,91,I-10/4,Muhammad Asghar,-,923314934457
200,1,92,I-10/2,Ahsan Javed,-,923335366986
201,2,92,I-10/2,Javed Saleem Shoresh,-,923005132492
202,3,92,I-10/2,Chaudhry Muhammad Yusuf Tanveer,-,923325692510
203,4,92,I-10/2,Hassan Javed,-,923215823433
204,5,92,I-10/2,Hanzala Tariq,-,923445644902
205,6,92,I-10/2,Hanifullah,Nazim UC,923459532660
206,7,92,I-10/2,Dr. Shakeel Mahmood,-,923465250360
207,8,92,I-10/2,Dr. Muhammad Yunus,-,923325058851
208,9,92,I-10/2,Dr. Muhammad Zafarullah,-,923065482263
209,10,92,I-10/2,Rashid Raheel,-,923444407215
210,11,92,I-10/2,Rafiq Mansoor,-,923490653094
211,12,92,I-10/2,Sajid Turabi,-,923335151465
212,13,92,I-10/2,Sardar Tariq Iqbal,-,923335226526
213,14,92,I-10/2,Syed Fahad Shah,-,923319361097
214,15,92,I-10/2,Sagheer Ahmed,-,923335068105
215,16,92,I-10/2,Sohaib Latif,-,923465410115
216,17,92,I-10/2,Zia Ahmed,-,923455573656
217,18,92,I-10/2,Ghulam Mujtaba,-,923345552909
218,19,92,I-10/2,Ghulam Mustafa,-,923006069990
219,20,92,I-10/2,Muhammad Arshad Yusuf,-,923345144844
220,21,92,I-10/2,Muhammad Ilyas,-,923455724175
221,22,92,I-10/2,Muhammad Javed Awan,-,923335361608
222,23,92,I-10/2,Muhammad Khalil,-,923365257912
223,24,92,I-10/2,Muhammad Saeed-ur-Rahman,-,923458883697
224,25,92,I-10/2,Muhammad Saleem,-,923335176953
225,26,92,I-10/2,Muhammad Kashif Chaudhry,Anjuman-e-Tajiran,923335166005
226,27,92,I-10/2,Muhammad Yunus Salik,Disabled,923005339095
227,28,92,I-10/2,Masood Ali Asdar,Nazim Maliyat,923339835233
228,29,92,I-10/2,Mushtaq Ahmed Khan,-,923335694878
229,30,92,I-10/2,Malik Yaqoob Awan,Faisalabad,923335666752
230,31,92,I-10/2,Mian Abdul Latif,-,923315018195
231,32,92,I-10/2,Mian Naseer Ahmed,Disabled,923455089811
232,33,92,I-10/2,Noor-ul-Bashar,-,923455914910
233,1,93,I-10/1,Anwar Niazi,-,923335297198
234,2,93,I-10/1,Owais Aftab,-,923345437540
235,3,93,I-10/1,Khawar Mahmood,-,923442701456
236,4,93,I-10/1,Saud-ul-Hassan,-,923335660062
237,5,93,I-10/1,Sheikh Shiraz Tariq,-,923165035465
238,6,93,I-10/1,Tariq Waseem,-,923335575874
239,7,93,I-10/1,Tahir Siddique,-,923465436130
240,8,93,I-10/1,Abdul Hameed Awan,-,923400586011
241,9,93,I-10/1,Abdul Aziz Khan,-,923125044939
242,10,93,I-10/1,Abdul Maroof,-,923015135850
243,11,93,I-10/1,Abdul Waheed,Malaysia/ UAE,-
244,12,93,I-10/1,Ghufranullah Bhatti,-,923215204394
245,13,93,I-10/1,-,-,920334522185
246,14,93,I-10/1,Muhammad Rafiq,-,-
247,15,93,I-10/1,Muhammad Fazlur Rahman Gondal,-,923335174879
248,16,93,I-10/1,Malik Muhammad Ayub Khan,-,923335151153
249,17,93,I-10/1,Malik Mazhar-ul-Hassan,-,923005050386
250,18,93,I-10/1,Mansoor Danish,-,923469609660"""

f = io.StringIO(csv_data)
reader = csv.DictReader(f)

data = []
for row in reader:
    data.append({
        "uc": row["UC"],
        "sector": row["Sector"],
        "name": row["Name"],
        "remarks": row["Remarks/Status"],
        "phone": row["Phone"]
    })

with open("database/seed_data/compiled_roster.json", "w") as out:
    json.dump(data, out, indent=2)

print(f"Processed {len(data)} participants.")
