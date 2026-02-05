—?import os
import re

source_file = r"c:/Users/ucqnrwi/AntiGemini/Moodle/EDI/Week 2 content.txt"
output_dir = r"c:/Users/ucqnrwi/AntiGemini/Moodle/EDI/Week 2"

with open(source_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Define the top-level sections
sections = [
    {
        "id": "2.0.1",
        "marker": "First, 2.0.1. Introduction: The Imperative of Positionality in EDI [10mins]:",
        "filename": "2.0.1_Introduction.html",
        "is_book": False
    },
    {
        "id": "2.1.1",
        "marker": "Then, in Topic 1: Deconstructing Power and Privilege through the Wheel, we have 2.1.1 Deconstructing Power and Privilege through the Wheel [90mins] which has four chapters:",
        "base_filename": "2.1.1_Chapter",
        "is_book": True,
        "chapter_names": [
            "Theoretical_Foundations",
            "The_Wheel_of_Power",
            "Critiques_and_Limitations",
            "Intersectionality"
        ]
    },
    {
        "id": "2.1.2",
        "marker": "Next, 2.1.2. Mapping Positionality on the WPP [40mins]:",
        "filename": "2.1.2_Mapping_Positionality.html",
        "is_book": False
    },
    {
        "id": "2.1.3",
        "marker": "Next, 2.1.3 Group Forum: Debating the WPP [60mins]:",
        "filename": "2.1.3_Group_Forum_Debating_WPP.html",
        "is_book": False
    },
    {
        "id": "2.1.4",
        "marker": "Next, 2.1.4 Group Submission: Proposing a Revised WPP [90mins]:",
        "filename": "2.1.4_Group_Submission_Revised_WPP.html",
        "is_book": False
    },
    {
        "id": "2.2.1",
        "marker": "Then, in Topic 2: Navigating EDI Interventions: Three Foundational Models, we have 2.2.1 EDI Intervention Models [40mins] which has five chapters:",
        "base_filename": "2.2.1_Chapter",
        "is_book": True,
        "chapter_names": [
            "Introduction_EDI_Models",
            "Deficit_Model",
            "Structural_Model",
            "Socio_psychological_Model",
            "Comparative_Analysis"
        ]
    },
    {
        "id": "2.2.2",
        "marker": "Next, 2.2.2 Applying the Models to EDI Initiatives [60mins]:",
        "filename": "2.2.2_Applying_Models.html",
        "is_book": False
    },
    {
        "id": "2.2.3",
        "marker": "Next, 2.2.3 Primary Intervention Design [60mins]:",
        "filename": "2.2.3_Primary_Intervention_Design.html",
        "is_book": False
    },
    {
        "id": "2.2.4",
        "marker": "Next, 2.2.4 The Interconnectedness of EDI Models [40mins]:",
        "filename": "2.2.4_Interconnectedness_EDI_Models.html",
        "is_book": False
    },
    {
        "id": "2.3.1",
        "marker": "Then, in Topic 3: Cultivating Critical Practice in EDI, we have, 2.3.1 Critical EDI for STEM & Politics [40mins] which has five chapters:",
        "base_filename": "2.3.1_Chapter",
        "is_book": True,
        "chapter_names": [
            "Defining_Critical_EDI",
            "Reflective_vs_Reflexive",
            "Reflexivity_Challenging_Power",
            "Actionable_Strategies",
            "Synthesis"
        ]
    },
    {
        "id": "2.3.2",
        "marker": "Next, 2.3.2 Reflexivity Journal [10mins]:",
        "filename": "2.3.2_Reflexivity_Journal.html",
        "is_book": False
    },
    {
        "id": "2.3.3",
        "marker": "Next, 2.3.3 Responding to EDI Challenges [40mins]:",
        "filename": "2.3.3_Responding_EDI_Challenges.html",
        "is_book": False
    },
    {
        "id": "2.3.4",
        "marker": "Next, 2.3.4 EDI Challenge Response Submission [60mins]:",
        "filename": "2.3.4_EDI_Challenge_Submission.html",
        "is_book": False
    },
    {
        "id": "2.3.5",
        "marker": "Next, 2.3.5 Critical EDI Action Plan [60mins]:",
        "filename": "2.3.5_Critical_EDI_Action_Plan.html",
        "is_book": False
    },
    {
        "id": "2.4.1",
        "marker": "And finally, in the Conclusions section we have 2.4.1 Conclusion: Towards Transformative EDI through Positionality [10mins]:",
        "filename": "2.4.1_Conclusion.html",
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
        # Chapters look like "Chapter X: <!-- ... -->"
        # We can regex split, but we need to keep the content associated with each.
        # The first chapter starts immediately or after the marker line.
        
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
             continue

        for k in range(1, len(parts), 2):
            if current_chapter_idx >= len(section["chapter_names"]):
                break
                
            header = parts[k] # e.g. "Chapter 1: <!-- ... -->"
            body = parts[k+1] if k+1 < len(parts) else ""
            
            # Combine header (comment) and body? 
            # Usually we want to remove the "Chapter X:" text but keep the HTML comment if it has useful metadata, 
            # or just keep the body. The user request says "Extract the full HTML content".
            # The "Chapter X:" text is likely not part of the HTML we want to render, but the comment might be.
            # Let's include the comment but strip the "Chapter X:" prefix if possible, or just keep it all and let the user decide.
            # Actually, looking at the file, "Chapter 1:" is followed by an HTML comment.
            # I will remove the "Chapter X:" label but keep the comment and the rest.
            
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
—?*cascade082@file:///c:/Users/ucqnrwi/AntiGemini/Moodle/EDI/process_week_2.py