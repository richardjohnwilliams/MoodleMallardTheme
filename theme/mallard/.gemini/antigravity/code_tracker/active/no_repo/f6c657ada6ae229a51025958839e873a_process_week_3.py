é@import os
import re

source_file = r"c:/Users/ucqnrwi/AntiGemini/Moodle/EDI/Week 3 content.txt"
output_dir = r"c:/Users/ucqnrwi/AntiGemini/Moodle/EDI/Week 3"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

with open(source_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Define the top-level sections
sections = [
    {
        "id": "3.1.1",
        "marker": "3.1.1 Neurodiversity: Beyond the Deficit Model [30mins]:",
        "filename": "3.1.1_Neurodiversity_Beyond_the_Deficit_Model.html",
        "is_book": False
    },
    {
        "id": "3.1.2",
        "marker": "Next, 3.1.2 Defining Neurodiversity and Disability: Beyond the Deficit Model [40mins] which has five chapters:",
        "base_filename": "3.1.2_Chapter",
        "is_book": True,
        "chapter_names": [
            "Why_Models_of_Disability_Matter",
            "The_Medical_Model",
            "The_Social_Model",
            "The_Affirmative_Model",
            "The_Neurodiversity_Paradigm"
        ]
    },
    {
        "id": "3.1.3",
        "marker": "Next, 3.1.3 Debating the Models of Disability [40mins]:",
        "filename": "3.1.3_Debating_the_Models_of_Disability.html",
        "is_book": False
    },
    {
        "id": "3.1.4",
        "marker": "Next, 3.1.4 Executive Functioning - Systemic Design & Strategy [60mins]:",
        "filename": "3.1.4_Executive_Functioning_Systemic_Design_and_Strategy.html",
        "is_book": False
    },
    {
        "id": "3.2.1",
        "marker": "3.2.1 Principles of Inclusive Design [40mins] which has seven chapters:",
        "base_filename": "3.2.1_Chapter",
        "is_book": True,
        "chapter_names": [
            "Introduction_to_Inclusive_Design",
            "Designing_Right_First_Time",
            "Grimaldi_et_al_2024",
            "Actions_in_Practice",
            "Standards_Codes_and_Supply_Chains",
            "How_the_Framework_Complements_the_Toolkit",
            "The_Royal_Academy_of_Engineerings_EDI_Engine"
        ]
    },
    {
        "id": "3.2.2",
        "marker": "Next, 3.2.2 Inaccessible Design [20mins]: <!-- Activity 2.1: Case Study Analysis: Inaccessible Designs (Forum) -->",
        "filename": "3.2.2_Inaccessible_Design.html",
        "is_book": False
    },
    {
        "id": "3.2.3",
        "marker": "Next, 3.2.3 Universal Design for Learning [60mins]: <!-- Activity 2.2: Universal Design for Learning (UDL) Application Plan (Database) -->",
        "filename": "3.2.3_Universal_Design_for_Learning.html",
        "is_book": False
    },
    {
        "id": "3.3.1",
        "marker": "3.3.1 Neurodivergent Potential [40mins] which has five chapters:",
        "base_filename": "3.3.1_Chapter",
        "is_book": True,
        "chapter_names": [
            "Framing_and_strengths_based_lens",
            "Strengths_in_practice",
            "Evidence_for_creativity_and_innovation",
            "Inclusion_as_a_strategic_engine",
            "Workplace_inclusion_and_wellbeing"
        ]
    },
    {
        "id": "3.3.2",
        "marker": "Next, 3.3.2 Strengths-Based Case Study Analysis [60mins]:",
        "filename": "3.3.2_Strengths_Based_Case_Study_Analysis.html",
        "is_book": False
    },
    {
        "id": "3.3.3",
        "marker": "Next, 3.3.3 Group Forum: Designing an Inclusive Workplace Initiative [20mins]: <!-- 3.x Group Forum: Designing an Inclusive Workplace Initiative (Neuroinclusion) -->",
        "filename": "3.3.3_Group_Forum_Designing_an_Inclusive_Workplace_Initiative.html",
        "is_book": False
    },
    {
        "id": "3.3.4",
        "marker": "Next, 3.3.4 Submitting a Neuroinclusive Workplace Initiative [60mins]: <!-- 3.x Group Database: Submitting a Neuroinclusive Workplace Initiative -->",
        "filename": "3.3.4_Submitting_a_Neuroinclusive_Workplace_Initiative.html",
        "is_book": False
    },
    {
        "id": "3.4.1",
        "marker": "3.4.1 From Equality to Equity: Rethinking Systemic Inclusion [40mins]:",
        "filename": "3.4.1_From_Equality_to_Equity_Rethinking_Systemic_Inclusion.html",
        "is_book": False
    },
    {
        "id": "3.4.2",
        "marker": "Next, 3.4.2 Policy Analysis: Gaps and Opportunities for Neuroinclusion [60mins]: <!-- Activity 4.1: Policy Analysis: Gaps and Opportunities for Neuroinclusion (1.5 hours) -->",
        "filename": "3.4.2_Policy_Analysis_Gaps_and_Opportunities_for_Neuroinclusion.html",
        "is_book": False
    },
    {
        "id": "3.4.3",
        "marker": "Next, 3.4.3 Advocacy Strategy Development [60mins]: <!-- Activity 4.2: Advocacy Strategy Development (1.5 hours) -->",
        "filename": "3.4.3_Advocacy_Strategy_Development.html",
        "is_book": False
    },
    {
        "id": "3.5.1",
        "marker": "3.5.1 Conclusions & Recommendations [10mins]: <!-- Conclusions & Recommendations -->",
        "filename": "3.5.1_Conclusions_and_Recommendations.html",
        "is_book": False
    }
]

# Find start indices
for i, section in enumerate(sections):
    start_idx = content.find(section["marker"])
    if start_idx == -1:
        print(f"Error: Marker not found for {section['id']}")
        continue
    
    # The content starts AFTER the marker line. 
    # We can find the end of the marker line.
    marker_end_idx = start_idx + len(section["marker"])
    
    # Find the start of the NEXT section to define the end of this one
    if i < len(sections) - 1:
        next_marker = sections[i+1]["marker"]
        end_idx = content.find(next_marker)
        if end_idx == -1:
             print(f"Error: Next marker not found for section after {section['id']}")
             end_idx = len(content)
    else:
        end_idx = len(content)
    
    section_content = content[marker_end_idx:end_idx].strip()
    
    if section["is_book"]:
        # Split by chapters
        # Chapters look like "Chapter X: <!-- ... -->" or "Chapter X: <div..."
        # We can regex split, but we need to keep the content associated with each.
        
        # Let's find all "Chapter \d+:" occurrences
        chapter_pattern = re.compile(r'(Chapter \d+:.*)')
        parts = chapter_pattern.split(section_content)
        
        # parts[0] might be empty or whitespace if the first chapter starts immediately
        # parts[1] is "Chapter 1: ...", parts[2] is content of ch1, parts[3] is "Chapter 2: ...", etc.
        
        current_chapter_idx = 0
        
        # Skip preamble if any (usually empty or just whitespace)
        start_k = 1 if not parts[0].strip() else 0
        
        # If the split didn't work as expected (e.g. no chapters found), warn
        if len(parts) < 2:
             print(f"Warning: No chapters found in {section['id']}")
             # Fallback: write entire content to one file if chapters not found?
             # Or just skip.
             continue

        for k in range(1, len(parts), 2):
            if current_chapter_idx >= len(section["chapter_names"]):
                break
                
            header = parts[k] # e.g. "Chapter 1: <!-- ... -->"
            body = parts[k+1] if k+1 < len(parts) else ""
            
            # Clean header: remove "Chapter \d+:"
            clean_header = re.sub(r'Chapter \d+:', '', header).strip()
            
            full_chapter_content = clean_header + "\n" + body
            full_chapter_content = full_chapter_content.strip()
            
            chapter_name = section["chapter_names"][current_chapter_idx]
            fname = f"{section['id']}_Chapter_{current_chapter_idx+1}_{chapter_name}.html"
            
            with open(os.path.join(output_dir, fname), 'w', encoding='utf-8') as out_f:
                out_f.write(full_chapter_content)
            
            print(f"Created {fname}")
            current_chapter_idx += 1
            
    else:
        # Single file
        with open(os.path.join(output_dir, section["filename"]), 'w', encoding='utf-8') as out_f:
            out_f.write(section_content)
        print(f"Created {section['filename']}")

print("Processing complete.")
¥ *cascade08¥¿*cascade08¿Á *cascade08ÁÂ*cascade08ÂÓ *cascade08Ó×*cascade08×ß *cascade08ßà*cascade08àÓ *cascade08Óá*cascade08áâ *cascade08âð*cascade08ðñ *cascade08ñÌ*cascade08ÌÎ *cascade08ÎÒ*cascade08ÒÓ *cascade08Óïïÿ *cascade08ÿ€*cascade08€ *cascade08‚*cascade08‚ƒ *cascade08ƒ„*cascade08„… *cascade08…‡*cascade08‡þ *cascade08þÿ*cascade08ÿã
 *cascade08ã
ä
*cascade08ä
¯ *cascade08¯¼*cascade08¼¿ *cascade08¿À*cascade08ÀÑ *cascade08ÑÖ*cascade08Öƒ *cascade08ƒ„*cascade08„… *cascade08…†*cascade08†‡ *cascade08‡ˆ*cascade08ˆŠ *cascade08ŠŒ*cascade08Œ *cascade08’*cascade08’“ *cascade08“”*cascade08”— *cascade08—˜*cascade08˜™ *cascade08™š*cascade08š› *cascade08›*cascade08® *cascade08®¯*cascade08¯° *cascade08°²*cascade08²´ *cascade08´¶*cascade08¶¸ *cascade08¸¹*cascade08¹º *cascade08º¼*cascade08¼½ *cascade08½Á*cascade08ÁÒ *cascade08ÒÓ*cascade08ÓÔ *cascade08ÔÕ*cascade08ÕÖ *cascade08Ö×*cascade08×Ø *cascade08ØÙ*cascade08ÙÝ *cascade08Ýâ*cascade08âã *cascade08ãä*cascade08äö *cascade08ö÷*cascade08÷ù *cascade08ùÿ*cascade08ÿ€ *cascade08€ƒ*cascade08ƒ… *cascade08…Ž*cascade08Ž *cascade08”*cascade08”• *cascade08•—*cascade08—¨ *cascade08¨¬*cascade08¬­ *cascade08­¯*cascade08¯° *cascade08°±*cascade08±² *cascade08²¶*cascade08¶· *cascade08·À*cascade08ÀÄ *cascade08ÄÑ*cascade08Ñâ *cascade08âç*cascade08çè *cascade08èê*cascade08êë *cascade08ëí*cascade08íî *cascade08îò*cascade08òô *cascade08ôû*cascade08ûü *cascade08üý*cascade08ýþ *cascade08þÿ*cascade08ÿ€ *cascade08€‚*cascade08‚ƒ *cascade08ƒ‹*cascade08‹ *cascade08Ž*cascade08Ž÷ *cascade08÷ù*cascade08ùÿ *cascade08ÿÈ*cascade08È‚ *cascade08‚ƒ*cascade08ƒŠ *cascade08Šá*cascade08á¬ *cascade08¬­*cascade08­® *cascade08®°*cascade08°¸ *cascade08¸¼*cascade08¼½ *cascade08½Ã*cascade08ÃÄ *cascade08ÄÊ*cascade08ÊË *cascade08ËÌ*cascade08Ìê *cascade08êë*cascade08ë *cascade08‘*cascade08‘Ÿ *cascade08Ÿ *cascade08 É *cascade08ÉÊ*cascade08ÊÓ *cascade08ÓÔ*cascade08Ôô *cascade08ôõ*cascade08õ‚ *cascade08‚ƒ*cascade08ƒù *cascade08ùÐ*cascade08Ðú *cascade08ú‡*cascade08‡› *cascade08›¦*cascade08¦É *cascade08É—*cascade08—À *cascade08ÀÂ*cascade08Â¿  *cascade08¿ Ý *cascade08Ý Š" *cascade08Š"è"*cascade08è"­# *cascade08­#À#*cascade08À#Ð$ *cascade08Ð$‘%*cascade08‘%×& *cascade08×&þ&*cascade08þ&é@ *cascade082@file:///c:/Users/ucqnrwi/AntiGemini/Moodle/EDI/process_week_3.py