˚>import re
import os

def process_week_1():
    file_path = 'c:/Users/ucqnrwi/AntiGemini/Moodle/EDI/Week 1 Content.txt'
    output_dir = 'c:/Users/ucqnrwi/AntiGemini/Moodle/EDI/Week 1'
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    sections = [
        {
            "id": "1.1.1",
            "marker": "1.1.1 Foundations of Equality, Diversity and Inclusion in UK Law [60mins]",
            "base_filename": "1.1.1_Chapter",
            "is_book": True,
            "chapter_names": [
                "Introduction_and_Defining_EDI",
                "UK_Legal_Framework_Equality_Act_2010",
                "Protected_Characteristics",
                "Public_Sector_Equality_Duty",
                "Gender_Pay_Gap_Reporting",
                "Revision_of_Learning_and_Key_Milestones"
            ]
        },
        {
            "id": "1.1.2",
            "marker": "Next, 1.1.2 Understanding Intersectionality",
            "filename": "1.1.2_Understanding_Intersectionality.html",
            "is_book": False
        },
        {
            "id": "1.1.3",
            "marker": "Next, 1.1.3 Case Study Analysis",
            "filename": "1.1.3_Case_Study_Analysis_Riverside_University.html",
            "is_book": False
        },
        {
            "id": "1.2.1",
            "marker": "Next, 1.2.1 Systems, Gatekeeping and Knowledge Equity in STEM",
            "base_filename": "1.2.1_Chapter",
            "is_book": True,
            "chapter_names": [
                "Systemic_Barriers_and_Under_representation_in_STEM",
                "Bias_Gatekeeping_and_Knowledge_Gaps",
                "Table_of_Examples_of_Systemic_Barriers",
                "Promoting_Inclusive_Excellence",
                "Summary_of_Key_Concepts"
            ]
        },
        {
            "id": "1.2.2",
            "marker": "Next, 1.2.2 Institutional EDI Strategy Analysis",
            "filename": "1.2.2_Institutional_EDI_Strategy_Analysis.html",
            "is_book": False
        },
        {
            "id": "1.2.3",
            "marker": "Next, 1.2.3 Designing Inclusive Research Proposals",
            "filename": "1.2.3_Designing_Inclusive_Research_Proposals_Forum.html",
            "is_book": False
        },
        {
            "id": "1.2.4",
            "marker": "Next, 1.2.4 Submitting Inclusive Research Proposals",
            "filename": "1.2.4_Designing_Inclusive_Research_Proposals_Database.html",
            "is_book": False
        },
        {
            "id": "1.3.1",
            "marker": "Next, 1.3.1 Advancing Equality through Policy and Democratic Engagement",
            "base_filename": "1.3.1_Chapter",
            "is_book": True,
            "chapter_names": [
                "Representation_and_Participation_of_Marginalised_Groups",
                "Impact_of_Policy_on_Equality",
                "Advancing_Equality_through_Policy"
            ]
        },
        {
            "id": "1.3.2",
            "marker": "Next, 1.3.2 PSED Effectiveness",
            "filename": "1.3.2_PSED_Effectiveness.html",
            "is_book": False
        },
        {
            "id": "1.3.3",
            "marker": "And finally, 1.3.3 Developing Recommendations for Political Parties",
            "filename": "1.3.3_Developing_Recommendations_for_Political_Parties.html",
            "is_book": False
        }
    ]

    def find_valid_section_start(marker, text, start_search_pos=0):
        pos = text.find(marker, start_search_pos)
        while pos != -1:
            # Check the next 200 chars for "pasted" or "New chat"
            snippet = text[pos:pos+500]
            if "pasted" in snippet or "New chat" in snippet:
                # This is a bad section, look for next occurrence
                pos = text.find(marker, pos + 1)
            else:
                return pos
        return -1

    # Collect all markers to use as end delimiters
    all_markers = [s["marker"] for s in sections]
    all_markers.append("That's it for week 1") # End of file marker

    current_pos = 0
    for i, section in enumerate(sections):
        print(f"Processing {section['id']}...")
        
        start_pos = find_valid_section_start(section["marker"], content, current_pos)
        if start_pos == -1:
            print(f"  WARNING: Could not find start marker for {section['id']}")
            continue
        
        # Update current_pos so we don't search backwards
        current_pos = start_pos
        
        # Find the nearest end marker
        nearest_end_pos = len(content)
        
        # Look for the next section's marker (or any subsequent section's marker)
        # We start searching for end markers AFTER the current marker
        search_start_for_end = start_pos + len(section["marker"])
        
        for other_marker in all_markers:
            if other_marker == section["marker"]:
                continue
            
            # We only care about markers that appear AFTER this one
            end_pos = content.find(other_marker, search_start_for_end)
            if end_pos != -1 and end_pos < nearest_end_pos:
                nearest_end_pos = end_pos
        
        section_content = content[search_start_for_end:nearest_end_pos].strip()
        print(f"  Section content length: {len(section_content)}")
        print(f"  Section content start snippet: {section_content[:100].encode('ascii', 'replace')}")
        
        if section["is_book"]:
            # Split by "Chapter X:"
            # We need to be careful not to split on the "This has X chapters:" line
            # The content usually starts with "Chapter 1: ..."
            
            # Find all chapter starts
            chapter_starts = []
            for ch_idx, ch_name in enumerate(section["chapter_names"]):
                ch_num = ch_idx + 1
                ch_marker = f"Chapter {ch_num}:"
                ch_pos = section_content.find(ch_marker)
                if ch_pos != -1:
                    print(f"    Found {ch_marker} at {ch_pos}")
                    chapter_starts.append((ch_num, ch_pos, ch_name))
                else:
                    print(f"    WARNING: Could not find {ch_marker}")
            
            # Sort by position just in case
            chapter_starts.sort(key=lambda x: x[1])
            
            for k, (ch_num, ch_start, ch_name) in enumerate(chapter_starts):
                # End of this chapter is start of next chapter or end of section
                if k < len(chapter_starts) - 1:
                    ch_end = chapter_starts[k+1][1]
                else:
                    ch_end = len(section_content)
                
                print(f"    Extracting Chapter {ch_num} from {ch_start} to {ch_end} (Length: {ch_end - ch_start})")
                ch_content = section_content[ch_start:ch_end].strip()
                # Remove the "Chapter X:" header from the content if desired, or keep it.
                # Usually we want to keep the HTML comment but maybe remove the "Chapter X:" text if it's raw text.
                # In the file, it looks like: "Chapter 1: <!-- WEEK 1 ... -->"
                # So keeping it is fine, or we can clean it up.
                
                filename = f"{section['base_filename']}_{ch_num}_{ch_name}.html"
                with open(os.path.join(output_dir, filename), 'w', encoding='utf-8') as out_f:
                    out_f.write(ch_content)
                print(f"  Created {filename}")
                
        else:
            with open(os.path.join(output_dir, section["filename"]), 'w', encoding='utf-8') as out_f:
                out_f.write(section_content)
            print(f"  Created {section['filename']}")

if __name__ == "__main__":
    process_week_1()
¯ *cascade08¯˝*cascade08˝ˇ *cascade08ˇÉ*cascade08É÷	 *cascade08÷	€	*cascade08€	‹	 *cascade08‹	ﬁ	*cascade08ﬁ	ﬂ	 *cascade08ﬂ	·	*cascade08·	± *cascade08±≤*cascade08≤” *cascade08”‘*cascade08‘÷ *cascade08÷◊*cascade08◊ÿ *cascade08ÿŸ*cascade08Ÿ› *cascade08›ﬁ*cascade08ﬁ‡ *cascade08‡„*cascade08„Á *cascade08ÁË*cascade08ËÍ *cascade08Í*cascade08– *cascade08–€*cascade08€∂ *cascade08∂¡*cascade08¡® *cascade08®≠*cascade08≠Æ *cascade08Æ∏*cascade08∏π *cascade08πª*cascade08ªû *cascade08ûü*cascade08ü† *cascade08†°*cascade08°¢ *cascade08¢£*cascade08£§ *cascade08§©*cascade08©™ *cascade08™≠*cascade08≠Æ *cascade08ÆØ*cascade08Ø≤ *cascade08≤≥*cascade08≥¥ *cascade08¥∑*cascade08∑∫ *cascade08∫º*cascade08ºΩ *cascade08Ωø*cascade08ø¬ *cascade08¬ƒ*cascade08ƒ≈ *cascade08≈À*cascade08ÀÃ *cascade08Ãœ*cascade08œ– *cascade08–“*cascade08“” *cascade08”÷*cascade08÷ÿ *cascade08ÿ⁄*cascade08⁄€ *cascade08€ﬁ*cascade08ﬁﬂ *cascade08ﬂ‡*cascade08‡· *cascade08·‚*cascade08‚„ *cascade08„Á*cascade08Á· *cascade08·‰*cascade08‰Â *cascade08ÂÏ*cascade08Ï• *cascade08•∑*cascade08∑˙ *cascade08˙˚*cascade08˚¸ *cascade08¸˝*cascade08˝Ç *cascade08ÇÑ*cascade08ÑÖ *cascade08Öâ*cascade08âç *cascade08çé*cascade08éê *cascade08êë*cascade08ëñ *cascade08ñó*cascade08óü *cascade08ü†*cascade08†° *cascade08°ß*cascade08ß© *cascade08©¨*cascade08¨≠ *cascade08≠Æ*cascade08ÆØ *cascade08Ø¥*cascade08¥µ *cascade08µ∑*cascade08∑√ *cascade08√≈*cascade08≈” *cascade08”€*cascade08€· *cascade08·‚*cascade08‚„ *cascade08„‰*cascade08‰Â *cascade08ÂÎ*cascade08Îˆ *cascade08ˆ¯*cascade08¯˘ *cascade08˘˚*cascade08˚¸ *cascade08¸˛*cascade08˛Ä *cascade08ÄÅ*cascade08Åî *cascade08îò*cascade08òô *cascade08ôú*cascade08úù *cascade08ùü*cascade08ü¢ *cascade08¢§*cascade08§• *cascade08•®*cascade08®© *cascade08©Æ*cascade08ÆØ *cascade08Ø≤*cascade08≤≥ *cascade08≥ª*cascade08ªº *cascade08ºæ*cascade08æø *cascade08ø√*cascade08√ƒ *cascade08ƒ…*cascade08…‘ *cascade08‘’*cascade08’◊ *cascade08◊ÿ*cascade08ÿŸ *cascade08Ÿ‹*cascade08‹ﬂ *cascade08ﬂ‡*cascade08‡· *cascade08·‚*cascade08‚„ *cascade08„Ú*cascade08ÚÙ *cascade08Ù˜*cascade08˜ˇ *cascade08ˇÖ*cascade08Öä *cascade08äë*cascade08ëí *cascade08íñ*cascade08ñó *cascade08óô*cascade08ôö *cascade08öú*cascade08úù *cascade08ù¢*cascade08¢£ *cascade08£≠*cascade08≠Ø *cascade08Ø∞*cascade08∞≤ *cascade08≤π*cascade08π¡ *cascade08¡—*cascade08—“ *cascade08“”*cascade08”‘ *cascade08‘ÿ*cascade08ÿŸ *cascade08Ÿﬁ*cascade08ﬁﬂ *cascade08ﬂ‚*cascade08‚Â *cascade08ÂË*cascade08ËÈ *cascade08ÈÔ*cascade08ÔÒ *cascade08ÒÚ*cascade08Úı *cascade08ıˆ*cascade08ˆÇ *cascade08Çà*cascade08àù *cascade08ùü*cascade08ü£ *cascade08£§*cascade08§¥ *cascade08¥µ*cascade08µÕ *cascade08Õœ*cascade08œ— *cascade08—‘*cascade08‘Â *cascade08ÂÁ*cascade08Á≥  *cascade08≥ ¥ *cascade08¥ º  *cascade08º Ω *cascade08Ω æ  *cascade08æ ¡ *cascade08¡ √  *cascade08√ ƒ *cascade08ƒ Í  *cascade08Í Ï *cascade08Ï Ó  *cascade08Ó Ô *cascade08Ô Ò  *cascade08Ò Ú *cascade08Ú Ù  *cascade08Ù ı *cascade08ı ¯  *cascade08¯ ˘ *cascade08˘ Å! *cascade08Å!Ç!*cascade08Ç!É! *cascade08É!Ñ!*cascade08Ñ!á! *cascade08á!â!*cascade08â!ä! *cascade08ä!å!*cascade08å!ù! *cascade08ù!ü!*cascade08ü!¶! *cascade08¶!ß!*cascade08ß!©! *cascade08©!™!*cascade08™!´! *cascade08´!¨!*cascade08¨!ù" *cascade08ù"û"*cascade08û"ü" *cascade08ü"†"*cascade08†"°" *cascade08°"¢"*cascade08¢"£" *cascade08£"•"*cascade08•"¶" *cascade08¶"®"*cascade08®"©" *cascade08©"™"*cascade08™"¨" *cascade08¨"¥"*cascade08¥"ª" *cascade08ª"º"*cascade08º"ø" *cascade08ø"ƒ"*cascade08ƒ"∆" *cascade08∆"À"*cascade08À"—" *cascade08—"‘"*cascade08‘"÷" *cascade08÷"ÿ"*cascade08ÿ"Ÿ" *cascade08Ÿ"€"*cascade08€"‹" *cascade08‹"›"*cascade08›"ﬂ" *cascade08ﬂ"‡"*cascade08‡"·" *cascade08·"Ë"*cascade08Ë"ı" *cascade08ı"ˆ"*cascade08ˆ"˙" *cascade08˙"¸"*cascade08¸"˛" *cascade08˛"ˇ"*cascade08ˇ"Ä# *cascade08Ä#Ü#*cascade08Ü#ï# *cascade08ï#ù#*cascade08ù#ü# *cascade08ü#ß#*cascade08ß#®# *cascade08®#≠#*cascade08≠#Ø# *cascade08Ø#±#*cascade08±#¥# *cascade08¥#∂#*cascade08∂#∫# *cascade08∫#ª#*cascade08ª#ƒ# *cascade08ƒ#≈#*cascade08≈#»# *cascade08»#…#*cascade08…#–# *cascade08–#—#*cascade08—#“# *cascade08“#Ÿ#*cascade08Ÿ#Á# *cascade08Á#È#*cascade08È#Î# *cascade08Î#Ó#*cascade08Ó#˘# *cascade08˘#˚#*cascade08˚#É$ *cascade08É$ã$*cascade08ã$ç$ *cascade08ç$ì$*cascade08ì$î$ *cascade08î$ó$*cascade08ó$ò$ *cascade08ò$ö$*cascade08ö$õ$ *cascade08õ$ú$*cascade08ú$ù$ *cascade08ù$†$*cascade08†$°$ *cascade08°$§$*cascade08§$ß$ *cascade08ß$®$*cascade08®$™$ *cascade08™$¨$*cascade08¨$≠$ *cascade08≠$Æ$*cascade08Æ$Ø$ *cascade08Ø$±$*cascade08±$≤$ *cascade08≤$≥$*cascade08≥$æ$ *cascade08æ$¿$*cascade08¿$«$ *cascade08«$Õ$*cascade08Õ$–$ *cascade08–$—$*cascade08—$“$ *cascade08“$’$*cascade08’$Î$ *cascade08Î$Ó$*cascade08Ó$Ô$ *cascade08Ô$Û$*cascade08Û$Ù$ *cascade08Ù$ˆ$*cascade08ˆ$˙$ *cascade08˙$˚$*cascade08˚$˛$ *cascade08˛$ˇ$*cascade08ˇ$Ä% *cascade08Ä%Ñ%*cascade08Ñ%Ö% *cascade08Ö%Ü%*cascade08Ü%ë% *cascade08ë%í%*cascade08í%ì% *cascade08ì%î%*cascade08î%ï% *cascade08ï%ü%*cascade08ü%†% *cascade08†%°%*cascade08°%ß% *cascade08ß%©%*cascade08©%™% *cascade08™%´%*cascade08´%¨% *cascade08¨%≠%*cascade08≠%∏% *cascade08∏%∫%*cascade08∫%¬% *cascade08¬%√%*cascade08√%ƒ% *cascade08ƒ%»%*cascade08»% % *cascade08 %Ã%*cascade08Ã%Õ% *cascade08Õ%Œ%*cascade08Œ%“% *cascade08“%’%*cascade08’%›% *cascade08›%ﬁ%*cascade08ﬁ%Ê% *cascade08Ê%Ô%*cascade08Ô%% *cascade08%ˆ%*cascade08ˆ%¯% *cascade08¯%˙%*cascade08˙%Å& *cascade08Å&Ç&*cascade08Ç&É& *cascade08É&Ñ&*cascade08Ñ&ï& *cascade08ï&ñ&*cascade08ñ&ó& *cascade08ó&ò&*cascade08ò&ö& *cascade08ö&õ&*cascade08õ&û& *cascade08û&°&*cascade08°&¢& *cascade08¢&£&*cascade08£&•& *cascade08•&¶&*cascade08¶&ß& *cascade08ß&´&*cascade08´&¨& *cascade08¨&Ø&*cascade08Ø&∞& *cascade08∞&≤&*cascade08≤&∫& *cascade08∫&ø&*cascade08ø&¿& *cascade08¿&¬&*cascade08¬&ƒ& *cascade08ƒ&»&*cascade08»&…& *cascade08…& &*cascade08 &‹& *cascade08‹&›&*cascade08›&ﬁ& *cascade08ﬁ&‚&*cascade08‚&„& *cascade08„&Â&*cascade08Â&Á& *cascade08Á&Î&*cascade08Î&Ï& *cascade08Ï&Ì&*cascade08Ì&Ò& *cascade08Ò&Ú&*cascade08Ú&Û& *cascade08Û&Ù&*cascade08Ù&ı& *cascade08ı&˜&*cascade08˜&¯& *cascade08¯&¸&*cascade08¸&˝& *cascade08˝&˛&*cascade08˛&ˇ& *cascade08ˇ&Ä'*cascade08Ä'Å' *cascade08Å'Ü'*cascade08Ü'à' *cascade08à'â'*cascade08â'ä' *cascade08ä'ç'*cascade08ç'é' *cascade08é'í'*cascade08í'ó' *cascade08ó'ü'*cascade08ü'©' *cascade08©'´'*cascade08´'∞' *cascade08∞'≤'*cascade08≤'∫' *cascade08∫'ª'*cascade08ª'º' *cascade08º'¿'*cascade08¿'»' *cascade08»'…'*cascade08…'⁄' *cascade08⁄'€'*cascade08€'‹' *cascade08‹'›'*cascade08›'‡' *cascade08‡'·'*cascade08·'‚' *cascade08‚'‰'*cascade08‰'Â' *cascade08Â'Ê'*cascade08Ê'Ë' *cascade08Ë'È'*cascade08È'Ú' *cascade08Ú'Û'*cascade08Û'ˆ' *cascade08ˆ'˜'*cascade08˜'¯' *cascade08¯'˙'*cascade08˙'˚' *cascade08˚'¸'*cascade08¸'é( *cascade08é(è(*cascade08è(ñ( *cascade08ñ(ò(*cascade08ò(ú( *cascade08ú(§(*cascade08§(≤( *cascade08≤(≥(*cascade08≥(¥( *cascade08¥(∂(*cascade08∂(∑( *cascade08∑(ª(*cascade08ª(º( *cascade08º(¿(*cascade08¿(¡( *cascade08¡(√(*cascade08√(∆( *cascade08∆(Ã(*cascade08Ã(Õ( *cascade08Õ(œ(*cascade08œ(‘( *cascade08‘(÷(*cascade08÷(◊( *cascade08◊(Ÿ(*cascade08Ÿ(€( *cascade08€(‡(*cascade08‡(‚( *cascade08‚(Â(*cascade08Â(Ê( *cascade08Ê(Á(*cascade08Á(˙( *cascade08˙(¸(*cascade08¸(˝( *cascade08˝(˛(*cascade08˛(ˇ( *cascade08ˇ(Ä)*cascade08Ä)à) *cascade08à)â)*cascade08â)ç) *cascade08ç)ê)*cascade08ê)ö) *cascade08ö)õ)*cascade08õ)†) *cascade08†)£)*cascade08£)ß) *cascade08ß)©)*cascade08©)¨) *cascade08¨)≠)*cascade08≠)Ø) *cascade08Ø)∞)*cascade08∞)¬) *cascade08¬)√)*cascade08√)ƒ) *cascade08ƒ)≈)*cascade08≈) ) *cascade08 )Ã)*cascade08Ã)Õ) *cascade08Õ)œ)*cascade08œ)”) *cascade08”)‘)*cascade08‘)÷) *cascade08÷)◊)*cascade08◊)Ÿ) *cascade08Ÿ)⁄)*cascade08⁄)‹) *cascade08‹)›)*cascade08›)‰) *cascade08‰)Ê)*cascade08Ê)È) *cascade08È)Î)*cascade08Î)Ì) *cascade08Ì)Ó)*cascade08Ó)á* *cascade08á*à**cascade08à*ã* *cascade08ã*è**cascade08è*ê* *cascade08ê*ë**cascade08ë*ì* *cascade08ì*õ**cascade08õ*∆* *cascade08∆*«**cascade08«*…* *cascade08…*À**cascade08À*Ã* *cascade08Ã*œ**cascade08œ*“* *cascade08“*÷**cascade08÷*◊* *cascade08◊*‹**cascade08‹*„* *cascade08„*‰**cascade08‰*Ê* *cascade08Ê*Ó**cascade08Ó*Ô* *cascade08Ô*Û**cascade08Û*˛* *cascade08˛*Å, *cascade08Å,ì,*cascade08ì,î, *cascade08î,ú,*cascade08ú,©, *cascade08©,˛, *cascade08˛,Ä-*cascade08Ä-Ç- *cascade08Ç-Ñ-*cascade08Ñ-Ü- *cascade08Ü-á-*cascade08á-ä- *cascade08ä-ã-*cascade08ã-ê- *cascade08ê-í-*cascade08í-õ- *cascade08õ-ú-*cascade08ú-ù- *cascade08ù-û-*cascade08û-°- *cascade08°-£-*cascade08£-®- *cascade08®-©-*cascade08©-Æ- *cascade08Æ-∞-*cascade08∞-≤- *cascade08≤-≥-*cascade08≥-¥- *cascade08¥-µ-*cascade08µ-Ω- *cascade08Ω-æ-*cascade08æ-ø- *cascade08ø-¿-*cascade08¿-”- *cascade08”-÷-*cascade08÷-‡- *cascade08‡-Ê-*cascade08Ê-Á- *cascade08Á-Ë-*cascade08Ë-Ó- *cascade08Ó-Ô-*cascade08Ô-Ò- *cascade08Ò-Ú-*cascade08Ú-Û- *cascade08Û-˜-*cascade08˜-¸- *cascade08¸-˛-*cascade08˛-ˇ- *cascade08ˇ-Å.*cascade08Å.Ç. *cascade08Ç.É.*cascade08É.°. *cascade08°.£.*cascade08£.¶. *cascade08¶.©.*cascade08©.™. *cascade08™.´.*cascade08´.¥. *cascade08¥.∑.*cascade08∑.∆. *cascade08∆.«.*cascade08«.Õ. *cascade08Õ.–.*cascade08–.—. *cascade08—.“.*cascade08“.”. *cascade08”.‘.*cascade08‘.’. *cascade08’.÷.*cascade08÷.◊. *cascade08◊.Ÿ.*cascade08Ÿ.ã0 *cascade08ã0ë0*cascade08ë0í0 *cascade08í0ì0*cascade08ì0î0 *cascade08î0û0*cascade08û0ü0 *cascade08ü0†0*cascade08†0°0 *cascade08°0¢0*cascade08¢0£0 *cascade08£0©0*cascade08©0≤0 *cascade08≤0≥0*cascade08≥0≈0 *cascade08≈0«0*cascade08«0»0 *cascade08»0Œ0*cascade08Œ0œ0 *cascade08œ0—0*cascade08—0“0 *cascade08“0’0*cascade08’0◊0 *cascade08◊0ò1*cascade08ò1¨1 *cascade08¨1¥1*cascade08¥1π1 *cascade08π1 1*cascade08 1À1 *cascade08À1Ã1*cascade08Ã1Õ1 *cascade08Õ1–1*cascade08–1—1 *cascade08—1“1*cascade08“1’1 *cascade08’1◊1*cascade08◊1ÿ1 *cascade08ÿ1Ÿ1*cascade08Ÿ1⁄1 *cascade08⁄1‹1*cascade08‹1ﬁ1 *cascade08ﬁ1º2*cascade08º2»2 *cascade08»2 2*cascade08 2÷2 *cascade08÷2⁄2*cascade08⁄2‹2 *cascade08‹2‡2*cascade08‡2„2 *cascade08„2‰2*cascade08‰2Ë2 *cascade08Ë2Ï2*cascade08Ï2Ì2 *cascade08Ì2Ó2*cascade08Ó22 *cascade082Ò2*cascade08Ò2Ú2 *cascade08Ú2Ù2*cascade08Ù2ı2 *cascade08ı2É3*cascade08É3Ö3 *cascade08Ö3ä3*cascade08ä3ã3 *cascade08ã3ç3*cascade08ç3è3 *cascade08è3ó3*cascade08ó3ô3 *cascade08ô3©3*cascade08©3∏3 *cascade08∏3∫3*cascade08∫3«3 *cascade08«3…3*cascade08…3 3 *cascade08 3Ÿ3*cascade08Ÿ3ﬁ3 *cascade08ﬁ3‚3*cascade08‚3„3 *cascade08„3Ë3*cascade08Ë3È3 *cascade08È3Î3*cascade08Î3Ï3 *cascade08Ï3Ö4*cascade08Ö4ò4 *cascade08ò4ô4*cascade08ô4ö4 *cascade08ö4ù4*cascade08ù4û4 *cascade08û4†4*cascade08†4°4 *cascade08°4•4*cascade08•4¶4 *cascade08¶4©4*cascade08©4™4 *cascade08™4¨4*cascade08¨4≠4 *cascade08≠4Æ4*cascade08Æ4Ø4 *cascade08Ø4∞4*cascade08∞4±4 *cascade08±4∂4*cascade08∂4∫4 *cascade08∫4ª4*cascade08ª4º4 *cascade08º4Ω4*cascade08Ω4æ4 *cascade08æ4ø4*cascade08ø4¬4 *cascade08¬4ƒ4*cascade08ƒ4«4 *cascade08«4À4*cascade08À4Ã4 *cascade08Ã4Õ4*cascade08Õ4Œ4 *cascade08Œ4—4*cascade08—4Í4 *cascade08Í4Ï4*cascade08Ï4Ì4 *cascade08Ì4Ó4*cascade08Ó4Ô4 *cascade08Ô44*cascade084Ò4 *cascade08Ò4Ñ5*cascade08Ñ5Ö5 *cascade08Ö5Ü5*cascade08Ü5á5 *cascade08á5â5*cascade08â5ü5 *cascade08ü5æ5*cascade08æ5 5 *cascade08 5ÿ5*cascade08ÿ5Ì5 *cascade08Ì5Ó5*cascade08Ó5Ô5 *cascade08Ô5Ò5*cascade08Ò5Ú5 *cascade08Ú5Û5*cascade08Û5Ù5 *cascade08Ù5ı5*cascade08ı5˜5 *cascade08˜5¯5*cascade08¯5ˇ5 *cascade08ˇ5á6*cascade08á6î6 *cascade08î6ö6 *cascade08ö6è7*cascade08è7ë7 *cascade08ë7ü7 *cascade08ü7®7*cascade08®7™7 *cascade08™7´7*cascade08´7Ω7 *cascade08Ω7æ7*cascade08æ7¡7 *cascade08¡7√7*cascade08√7≈7 *cascade08≈7 7*cascade08 7À7 *cascade08À7—7*cascade08—7“7 *cascade08“7’7*cascade08’7Ë7 *cascade08Ë7È7*cascade08È7Í7 *cascade08Í77*cascade087Ò7 *cascade08Ò7Ù7*cascade08Ù7ı7 *cascade08ı7˝7*cascade08˝7˛7 *cascade08˛7Å8*cascade08Å8Ç8 *cascade08Ç8à8*cascade08à8â8 *cascade08â8ç8*cascade08ç8é8 *cascade08é8ô8*cascade08ô8ù8 *cascade08ù8û8*cascade08û8ü8 *cascade08ü8£8*cascade08£8§8 *cascade08§8¶8*cascade08¶8ß8 *cascade08ß8®8*cascade08®8©8 *cascade08©8≠8*cascade08≠8Æ8 *cascade08Æ8±8*cascade08±8√8 *cascade08√8ƒ8*cascade08ƒ8≈8 *cascade08≈8Ã8*cascade08Ã8Õ8 *cascade08Õ8œ8*cascade08œ8–8 *cascade08–8‘8*cascade08‘8’8 *cascade08’8◊8*cascade08◊8ÿ8 *cascade08ÿ8‹8*cascade08‹8›8 *cascade08›8‡8*cascade08‡8·8 *cascade08·8Â8*cascade08Â8Ê8 *cascade08Ê8Ì8*cascade08Ì8Ó8 *cascade08Ó8Ò8*cascade08Ò8Ú8 *cascade08Ú8˜8*cascade08˜8¯8 *cascade08¯8˘8*cascade08˘8˙8 *cascade08˙8˚8*cascade08˚8¸8 *cascade08¸8˛8*cascade08˛8ˇ8 *cascade08ˇ8Ç9*cascade08Ç9É9 *cascade08É9â9*cascade08â9ä9 *cascade08ä9ë9*cascade08ë9í9 *cascade08í9ì9*cascade08ì9î9 *cascade08î9ï9*cascade08ï9ñ9 *cascade08ñ9°9*cascade08°9£9 *cascade08£9§9*cascade08§9•9 *cascade08•9¶9*cascade08¶9∏9 *cascade08∏9π9*cascade08π9∫9 *cascade08∫9º9*cascade08º9Ω9 *cascade08Ω9¿9*cascade08¿9¡9 *cascade08¡9∆9*cascade08∆9«9 *cascade08«9…9*cascade08…9 9 *cascade08 9œ9*cascade08œ9–9 *cascade08–9’9*cascade08’9÷9 *cascade08÷9ﬁ9*cascade08ﬁ9ﬂ9 *cascade08ﬂ9·9*cascade08·9‚9 *cascade08‚9Ê9*cascade08Ê9Á9 *cascade08Á9Î9*cascade08Î9Ï9 *cascade08Ï9Ì9*cascade08Ì9Ó9 *cascade08Ó9Ò9*cascade08Ò9Ú9 *cascade08Ú9¯9*cascade08¯9à: *cascade08à:â:*cascade08â:ä: *cascade08ä:å:*cascade08å:ç: *cascade08ç:è:*cascade08è:ê: *cascade08ê:í:*cascade08í:ì: *cascade08ì:î:*cascade08î:ï: *cascade08ï:ó:*cascade08ó:ò: *cascade08ò:ô:*cascade08ô:ö: *cascade08ö:ú:*cascade08ú:û: *cascade08û:°:*cascade08°:¢: *cascade08¢:•:*cascade08•:¶: *cascade08¶:®:*cascade08®:©: *cascade08©:≠:*cascade08≠:Æ: *cascade08Æ:Ø:*cascade08Ø:∞: *cascade08∞:µ:*cascade08µ:√: *cascade08√:À:*cascade08À:Ÿ: *cascade08Ÿ:€:*cascade08€:Ù< *cascade08Ù<˚<*cascade08˚<˚> *cascade082@file:///c:/Users/ucqnrwi/AntiGemini/Moodle/EDI/process_week_1.py