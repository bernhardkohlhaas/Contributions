| package |
package := Package name: 'DuplicateFileFinder'.
package paxVersion: 0;
	basicComment: 'Copyright (c) 2002-2004 Robert Jarvis

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
'.

package basicScriptAt: #preinstall put: 'Win32Constants
	at: ''FILE_ATTRIBUTE_HIDDEN'' put: 2;
	at: ''FILE_ATTRIBUTE_SYSTEM'' put: 4;
	at: ''FILE_ATTRIBUTE_DIRECTORY'' put: 16r10;
	at: ''FILE_ATTRIBUTE_ARCHIVE'' put: 16r20;
	at: ''FILE_ATTRIBUTE_TEMPORARY'' put: 16r100;
	at: ''FILE_ATTRIBUTE_COMPRESSED'' put: 16r800;
	at: ''FILE_ATTRIBUTE_OFFLINE'' put: 16r1000
'.

package classNames
	add: #DuplicateFileFinder;
	add: #DuplicateFileShell;
	add: #DuplicateFileShell2;
	add: #DuplicateFileShell3;
	yourself.

package methodNames
	add: #WIN32_FIND_DATA -> #isArchive;
	add: #WIN32_FIND_DATA -> #isCompressed;
	add: #WIN32_FIND_DATA -> #isHidden;
	add: #WIN32_FIND_DATA -> #isOffline;
	add: #WIN32_FIND_DATA -> #isSystem;
	add: #WIN32_FIND_DATA -> #isTemporary;
	yourself.

package binaryGlobalNames: (Set new
	yourself).

package globalAliases: (Set new
	yourself).

package allResourceNames: (Set new
	add: #DuplicateFileShell -> 'DuplicateFileView';
	add: #DuplicateFileShell2 -> 'DuplicateFileView2';
	add: #DuplicateFileShell3 -> 'DuplicateFileView3';
	yourself).

package setPrerequisites: (IdentitySet new
	add: '..\..\Object Arts\Dolphin\Base\Dolphin';
	add: '..\..\Object Arts\Dolphin\MVP\Views\Control Bars\Dolphin Control Bars';
	add: '..\..\Object Arts\Dolphin\MVP\Base\Dolphin MVP Base';
	add: '..\..\Object Arts\Dolphin\MVP\Type Converters\Dolphin Type Converters';
	add: '..\..\Object Arts\Dolphin\MVP\Models\Value\Dolphin Value Models';
	yourself).

package!

"Class Definitions"!

Model subclass: #DuplicateFileFinder
	instanceVariableNames: 'driveList filenames drive'
	classVariableNames: ''
	poolDictionaries: 'Win32Constants'
	classInstanceVariableNames: ''!
Shell subclass: #DuplicateFileShell
	instanceVariableNames: 'drivePresenter filenamePresenter directoryPresenter'
	classVariableNames: ''
	poolDictionaries: ''
	classInstanceVariableNames: ''!
DuplicateFileShell subclass: #DuplicateFileShell2
	instanceVariableNames: ''
	classVariableNames: ''
	poolDictionaries: ''
	classInstanceVariableNames: ''!
DuplicateFileShell subclass: #DuplicateFileShell3
	instanceVariableNames: 'statusValueHolder'
	classVariableNames: ''
	poolDictionaries: ''
	classInstanceVariableNames: ''!

"Global Aliases"!


"Loose Methods"!

!WIN32_FIND_DATA methodsFor!

isArchive
	"Answer whether the receiver describes an entity which has changed since the last backup."

	^self dwFileAttributes allMask: FILE_ATTRIBUTE_ARCHIVE

!

isCompressed
	"Answer whether the receiver describes a temporary entity."

	^self dwFileAttributes allMask: FILE_ATTRIBUTE_COMPRESSED!

isHidden
	"Answer whether the receiver describes a directory."

	^self dwFileAttributes allMask: FILE_ATTRIBUTE_HIDDEN

!

isOffline
	"Answer whether the receiver describes an entity stored offline."

	^self dwFileAttributes allMask: FILE_ATTRIBUTE_OFFLINE!

isSystem
	"Answer whether the receiver describes a system entity."

	^self dwFileAttributes allMask: FILE_ATTRIBUTE_SYSTEM

!

isTemporary
	"Answer whether the receiver describes a temporary entity."

	^self dwFileAttributes allMask: FILE_ATTRIBUTE_TEMPORARY! !
!WIN32_FIND_DATA categoriesFor: #isArchive!public! !
!WIN32_FIND_DATA categoriesFor: #isCompressed!public! !
!WIN32_FIND_DATA categoriesFor: #isHidden!public! !
!WIN32_FIND_DATA categoriesFor: #isOffline!public! !
!WIN32_FIND_DATA categoriesFor: #isSystem!public! !
!WIN32_FIND_DATA categoriesFor: #isTemporary!public! !

"End of package definition"!

"Source Globals"!

"Classes"!

DuplicateFileFinder guid: (GUID fromString: '{42DAA27F-5EDF-11D3-826E-00001D19F5C2}')!
DuplicateFileFinder comment: 'Events triggered:
#driveChanged	Triggered when drive letter changed and new duplicate list is available'!
!DuplicateFileFinder categoriesForClass!No category! !
!DuplicateFileFinder methodsFor!

drive
	^drive!

drive: aString
	drive := aString.
	filenames := nil.
	self searchDrive: self drive.
	self trigger: #driveChanged.
	^self drive!

driveList
	^driveList!

driveList: anArray
	driveList := anArray!

duplicateFiles
	^self filenames select: [ :each | each size > 1 ]!

filenames
	filenames isNil
		ifTrue: [ filenames := Dictionary new initialize ].
	^filenames!

initialize
	| aCollection anOtherCollection |

	aCollection := self logicalDriveStrings.
	anOtherCollection := OrderedCollection new initialize.

	aCollection do: [ :aString | anOtherCollection add: ((aString subStrings: ':\') at: 1) ].

	self driveList: anOtherCollection!

logicalDriveStrings
	"Answers a collection of strings containing the valid drive names in the system."

	| buffer bufferSize lastWasNul aCollection aString |

	bufferSize := (26 * 4) + 1.
	buffer := String new: bufferSize.

	(KernelLibrary default getLogicalDriveStrings: bufferSize asParameter buffer: buffer) == 0
		ifTrue: [ KernelLibrary default systemError ].

	"We can't use String>>subStrings: here because the NUL characters in the string terminate
	 the substring search.  Instead we have to iterate over the string returned by
	 getLogicalDriveStrings."

	lastWasNul := false.
	aCollection := OrderedCollection new initialize.
	aString := String new initialize.

	buffer do: [ :aCharacter |
		aCharacter asInteger = 0
			ifTrue: [ lastWasNul
					ifTrue: [ ^aCollection ]
					ifFalse: [ aCollection add: aString.
						     aString := String new initialize.
						     lastWasNul := true ] ]
			ifFalse: [ lastWasNul := false.
				      aString := aString, aCharacter asSymbol ] ].

	^aCollection!

processEntry: aWin32FindData inDirectory: aDirectoryName
	(aWin32FindData isDirectory)
		ifTrue: [
			(aWin32FindData fileName = '.') | (aWin32FindData fileName = '..')
				ifFalse: [ self searchDirectory: aDirectoryName, aWin32FindData fileName, '\' ] ]
		ifFalse: [ self recordFilename: aWin32FindData fileName inDirectory: aDirectoryName]!

recordFilename: aFilename inDirectory: aDirectoryName
	(self filenames
		at: aFilename
		ifAbsentPut: [ OrderedCollection new initialize ]) add: aDirectoryName!

searchDirectory: aString
	"Private: search the directory given in aString"

	(File find: aString, '*.*') do: [ :each | self processEntry: each inDirectory: aString ]!

searchDrive: aString
	"Search the drive specified in aString for duplicates.  Answer a collection
	 of duplicate file names."

	self searchDirectory: aString, ':\'.
	^self duplicateFiles! !
!DuplicateFileFinder categoriesFor: #drive!accessing!public! !
!DuplicateFileFinder categoriesFor: #drive:!accessing!public! !
!DuplicateFileFinder categoriesFor: #driveList!public! !
!DuplicateFileFinder categoriesFor: #driveList:!public! !
!DuplicateFileFinder categoriesFor: #duplicateFiles!accessing!public! !
!DuplicateFileFinder categoriesFor: #filenames!private! !
!DuplicateFileFinder categoriesFor: #initialize!public! !
!DuplicateFileFinder categoriesFor: #logicalDriveStrings!public! !
!DuplicateFileFinder categoriesFor: #processEntry:inDirectory:!private! !
!DuplicateFileFinder categoriesFor: #recordFilename:inDirectory:!private! !
!DuplicateFileFinder categoriesFor: #searchDirectory:!private! !
!DuplicateFileFinder categoriesFor: #searchDrive:!public!searching! !

!DuplicateFileFinder class methodsFor!

searchDrive: aString
	^self new searchDrive: aString! !
!DuplicateFileFinder class categoriesFor: #searchDrive:!public!searching! !

DuplicateFileShell guid: (GUID fromString: '{42DAA280-5EDF-11D3-826E-00001D19F5C2}')!
DuplicateFileShell comment: ''!
!DuplicateFileShell categoriesForClass!No category! !
!DuplicateFileShell methodsFor!

createComponents
	"Private - Create the presenters for components in the view"

	super createComponents.
	self drivePresenter: (self add: ListPresenter new name: 'drives').
	self filenamePresenter: (self add: ListPresenter new name: 'filenames').
	self directoryPresenter: (self add: ListPresenter new name: 'directories').!

createSchematicWiring
	super createSchematicWiring.

	self drivePresenter
		when: #selectionChanged send: #onDriveChanged to: self.

	self filenamePresenter
		when: #selectionChanged send: #onFilenameChanged to: self.

	self model
		when: #driveChanged send: #onListUpdated to: self.!

directoryPresenter
	^directoryPresenter!

directoryPresenter: aPresenter
	directoryPresenter := aPresenter!

drivePresenter
	^drivePresenter!

drivePresenter: aPresenter
	drivePresenter := aPresenter!

filenamePresenter
	^filenamePresenter!

filenamePresenter: aPresenter
	filenamePresenter := aPresenter!

onDriveChanged
	"Handle the user changing the selected drive"

	| selection |

	self filenamePresenter clear.
	self directoryPresenter clear.
	self view update.
	selection := self drivePresenter selectionIfNone: [ nil ].
	selection isNil
		ifFalse: [ Cursor wait showWhile:
				[ [self model drive: selection]
					on: Win32Error do: [ :anException |
						anException statusCode ~= 16r15
							ifTrue: [ anException pass ] ] ] ]!

onFilenameChanged
	"Change the contents of directoryPresenter to match the new selection in filenamePresenter"

	| selection |

	selection := self filenamePresenter selectionIfNone: [ nil ].
	selection isNil
		ifFalse: [ self directoryPresenter list: (self model filenames at: selection) ]!

onListUpdated
	"Fill the filename box"

	self filenamePresenter list: self model duplicateFiles keys asSortedCollection!

onViewOpened
	"Private - perform all initializations required when the view is opened"

	super onViewOpened.
	self drivePresenter list: model driveList! !
!DuplicateFileShell categoriesFor: #createComponents!public! !
!DuplicateFileShell categoriesFor: #createSchematicWiring!public! !
!DuplicateFileShell categoriesFor: #directoryPresenter!public! !
!DuplicateFileShell categoriesFor: #directoryPresenter:!public! !
!DuplicateFileShell categoriesFor: #drivePresenter!public! !
!DuplicateFileShell categoriesFor: #drivePresenter:!public! !
!DuplicateFileShell categoriesFor: #filenamePresenter!public! !
!DuplicateFileShell categoriesFor: #filenamePresenter:!public! !
!DuplicateFileShell categoriesFor: #onDriveChanged!public! !
!DuplicateFileShell categoriesFor: #onFilenameChanged!public! !
!DuplicateFileShell categoriesFor: #onListUpdated!public! !
!DuplicateFileShell categoriesFor: #onViewOpened!public! !

!DuplicateFileShell class methodsFor!

defaultModel
	^DuplicateFileFinder new initialize!

defaultView
	^'DuplicateFileView'! !
!DuplicateFileShell class categoriesFor: #defaultModel!public! !
!DuplicateFileShell class categoriesFor: #defaultView!public! !

DuplicateFileShell2 guid: (GUID fromString: '{42DAA281-5EDF-11D3-826E-00001D19F5C2}')!
DuplicateFileShell2 comment: ''!
!DuplicateFileShell2 categoriesForClass!No category! !
!DuplicateFileShell2 class methodsFor!

defaultView
	^'DuplicateFileView2'
! !
!DuplicateFileShell2 class categoriesFor: #defaultView!public! !

DuplicateFileShell3 guid: (GUID fromString: '{42DAA282-5EDF-11D3-826E-00001D19F5C2}')!
DuplicateFileShell3 comment: ''!
!DuplicateFileShell3 categoriesForClass!No category! !
!DuplicateFileShell3 methodsFor!

initialize
	super initialize.
	statusValueHolder := ValueHolder new.!

onDriveChanged
	| selection |

	selection := self drivePresenter selectionIfNone: [ nil ].
	selection notNil
		ifTrue: [ self status: (Notification new messageText: 'Scanning drive ', selection, '...') ].
	super onDriveChanged.
	self status: nil.
	self view update.!

onViewOpened
	"Received when the receiver's view is been connected. "

	| statusItem |

	super onViewOpened.
	statusItem := self view viewNamed: 'text' ifNone: [].
	statusItem notNil ifTrue: [
		statusItem model: statusValueHolder ].
	self status: nil!

status: anObject
	statusValueHolder value: anObject! !
!DuplicateFileShell3 categoriesFor: #initialize!public! !
!DuplicateFileShell3 categoriesFor: #onDriveChanged!public! !
!DuplicateFileShell3 categoriesFor: #onViewOpened!public! !
!DuplicateFileShell3 categoriesFor: #status:!public! !

!DuplicateFileShell3 class methodsFor!

defaultView
	^'DuplicateFileView3'
! !
!DuplicateFileShell3 class categoriesFor: #defaultView!public! !

"Binary Globals"!

"Resources"!

(ResourceIdentifier class: DuplicateFileShell name: 'DuplicateFileView') assign: (Object fromBinaryStoreBytes:
(ByteArray fromHexString: '2153544220312046020C0001000000566965775265736F75726365000000000E0124005354425265736F757263655354424279746541727261794163636573736F7250726F78790000000072000000280D0000215354422031204E080C000A0000005354425669657750726F7879000000009A000000000000005200000010000000446F6C7068696E204D5650204261736552000000090000005368656C6C56696577620000001B0000000000000000000000620000000200000001009E0101000200A001000000000000460103000100000052474200000000818181010000000007000000000000000000000000000000A001000000000000EA000000000000000001000062000000060000009A010000000000009A00000000000000C00100005200000008000000436F6D626F426F78620000001100000000000000A00100006200000002000000820000000400000003063144010400004002000046030900020000004C6973744D6F64656C00000000CA00000000000000D00000006200000000000000000000000E02110053544253696E676C65746F6E50726F7879000000009A000000000000005200000007000000446F6C7068696E520000000C000000536561726368506F6C696379BA0000000000000052000000080000006964656E74697479000000000000000007000000000000000000000000000000400200000000000082000000040000003705E2779A00000000000000C0010000520000001100000042617369634C697374416273747261637462000000000000009101000006010F004D65737361676553657175656E636500000000CA00000000000000D0000000620000000200000006030B004D65737361676553656E6400000000BA00000000000000520000001000000063726561746541743A657874656E743A620000000200000006020500506F696E7400000000870000001B0000002204000000000000150100003700000040020000D203000000000000BA000000000000005200000017000000626173696353656C656374696F6E734279496E6465783A620000000100000062000000000000004002000006010F0057494E444F57504C4143454D454E5400000000720000002C0000002C0000000000000001000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF430000000D000000CD00000028000000CA00000000000000D0000000D00200002204000000000000D5000000D5000000000000001300000052000000060000006472697665739A010000000000009A00000000000000C001000052000000070000004C697374426F78620000001100000000000000A001000062000000020000008200000004000000010131440104000000050000A202000000000000CA00000000000000D0000000D002000000000000F00200000000000000000000070000000000000000000000000000000005000000000000820000000400000038F3E2776003000080030000200000009203000000000000CA00000000000000D00000006200000003000000D203000000000000F00300006200000002000000220400000000000009020000AB0000002204000000000000810200008301000000050000D2030000000000006004000062000000010000009004000000050000D203000000000000BA000000000000005200000011000000686F72697A6F6E74616C457874656E743A62000000010000000100000000050000A204000000000000720000002C0000002C0000000000000001000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF04010000550000004402000016010000CA00000000000000D0000000D0020000E00400000000000013000000520000000B0000006469726563746F726965739A0100000000000010050000620000001100000000000000A0010000620000000200000082000000040000000101314401040000A0060000A202000000000000CA00000000000000D0000000D002000000000000F0020000000000000000000007000000000000000000000000000000A006000000000000820000000400000038F3E2776003000080030000200000009203000000000000CA00000000000000D00000006200000003000000D203000000000000F00300006200000002000000220400000000000023000000AB0000002204000000000000BB01000083010000A0060000D20300000000000060040000620000000100000090040000A0060000D20300000000000030060000620000000100000001000000A0060000A204000000000000720000002C0000002C0000000000000001000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF1100000055000000EE00000016010000CA00000000000000D0000000D0020000E00400000000000013000000520000000900000066696C656E616D65730000000046050700020000004D656E75426172000000000000000010000000620000000100000046050400020000004D656E75000000000000000010000000620000000100000046040F0002000000436F6D6D616E644D656E754974656D00000000010000004605120004000000436F6D6D616E644465736372697074696F6E00000000BA0000000000000052000000040000006578697452000000050000004526786974B12000000100000000000000000000000000000052000000050000002646696C65000000005200000000000000000000000000000006031000416363656C657261746F725461626C65000000000000000010000000620000000100000006020B004173736F63696174696F6E00000000B1200000900800000000000001000000000000000000000000000000000000000100000000000000000000009203000000000000CA00000000000000D00000006200000003000000D203000000000000F0030000620000000200000022040000000000000B0000000B0000002204000000000000BF040000AD020000A0010000D203000000000000BA000000000000005200000005000000746578743A620000000100000052000000150000004475706C69636174652046696C652046696E646572A0010000D203000000000000BA0000000000000052000000080000006D656E754261723A620000000100000010080000A0010000A204000000000000720000002C0000002C0000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0500000005000000640200005B010000CA00000000000000D00000006200000006000000400200009A010000000000009A00000000000000C0010000520000000A00000053746174696354657874620000001000000000000000A0010000620000000200000082000000040000000001004401000000800A0000000000000202000000000000818181010000000007000000000000000000000000000000800A0000000000008200000004000000DB10E27706020D004E756C6C436F6E766572746572000000000000000000000000000000009203000000000000CA00000000000000D00000006200000002000000D203000000000000F003000062000000020000002204000000000000230000001B00000022040000000000005900000037000000800A0000D203000000000000C00900006200000001000000520000000600000044726976653A800A0000A204000000000000720000002C0000002C0000000000000001000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF110000000D0000003D00000028000000CA00000000000000D0000000D0020000E00400000000000013000000A0060000000500009A01000000000000900A0000620000001000000000000000A0010000620000000200000082000000040000000001004401000000F00B0000000000000202000000000000818181010000000007000000000000000000000000000000F00B0000000000008200000004000000DB10E277020B0000000000000000000000000000000000009203000000000000CA00000000000000D00000006200000002000000D203000000000000F003000062000000020000002204000000000000230000007D00000022040000000000000B0100002F000000F00B0000D203000000000000C00900006200000001000000520000000900000046696C656E616D6573F00B0000A204000000000000720000002C0000002C0000000000000001000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF110000003E0000009600000055000000CA00000000000000D0000000D0020000E004000000000000130000009A01000000000000900A0000620000001000000000000000A0010000620000000200000082000000040000000001004401000000300D0000000000000202000000000000818181010000000007000000000000000000000000000000300D0000000000008200000004000000DB10E277020B0000000000000000000000000000000000009203000000000000CA00000000000000D00000006200000002000000D203000000000000F003000062000000020000002204000000000000090200007300000022040000000000000B0100002D000000300D0000D203000000000000C00900006200000001000000520000000B0000004469726563746F72696573300D0000A204000000000000720000002C0000002C0000000000000001000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0401000039000000890100004F000000CA00000000000000D0000000D0020000E00400000000000013000000E00400000000000015000000460504000300000049636F6E0000000000000000100000000E02110053544253696E676C65746F6E50726F7879000000009A000000000000005200000007000000446F6C7068696E5200000018000000496D61676552656C617469766546696C654C6F6361746F72BA00000000000000520000000700000063757272656E74520000000D0000005368656C6C566965772E69636F0E021F0053544245787465726E616C5265736F757263654C69627261727950726F7879000000005200000010000000646F6C7068696E64723030352E646C6C00000000'))!

(ResourceIdentifier class: DuplicateFileShell2 name: 'DuplicateFileView2') assign: (Object fromBinaryStoreBytes:
(ByteArray fromHexString: '2153544220312046020C0001000000566965775265736F75726365000000000E0124005354425265736F757263655354424279746541727261794163636573736F7250726F78790000000072000000630B0000215354422031204E080C000A0000005354425669657750726F7879000000009A000000000000005200000010000000446F6C7068696E204D5650204261736552000000090000005368656C6C56696577620000001B0000000000000000000000620000000200000001009E0101000200A001000000000000460103000100000052474200000000818181010000000007000000000000000000000000000000A001000006070C00426F726465724C61796F7574000000000100000001000000000000000000000000000000000000009A010000000000009A00000000000000C0010000520000000D000000436F6E7461696E657256696577620000000F00000000000000A001000062000000020000008200000004000000000000440100020040020000000000000202000000000000818181010000000007000000000000000000000000000000400200000602120050726F706F7274696F6E616C4C61796F757400000000EA00000000000000F000000062000000060000009A010000000000009A00000000000000C001000052000000070000004C697374426F7862000000110000000000000040020000620000000200000082000000040000000101314401040000F002000046030900020000004C6973744D6F64656C00000000CA00000000000000D00000006200000000000000000000000E02110053544253696E676C65746F6E50726F7879000000009A000000000000005200000007000000446F6C7068696E520000000C000000536561726368506F6C696379BA0000000000000052000000080000006964656E74697479000000000000000007000000000000000000000000000000F002000000000000820000000400000038F3E2779A00000000000000C0010000520000001100000042617369634C697374416273747261637462000000000000002000000006010F004D65737361676553657175656E636500000000CA00000000000000D0000000620000000300000006030B004D65737361676553656E6400000000BA00000000000000520000001000000063726561746541743A657874656E743A620000000200000006020500506F696E74000000000D00000041000000D20400000000000065020000E5010000F00200008204000000000000BA000000000000005200000017000000626173696353656C656374696F6E734279496E6465783A62000000010000006200000000000000F00200008204000000000000BA000000000000005200000011000000686F72697A6F6E74616C457874656E743A620000000100000001000000F002000006010F0057494E444F57504C4143454D454E5400000000720000002C0000002C0000000000000001000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF06000000200000003801000012010000CA00000000000000D000000080030000D204000000000000D5000000D50000000000000013000000060208004672616374696F6E00000000470000004B0000009A010000000000009A00000000000000C0010000520000000800000053706C6974746572620000000C00000000000000400200006200000002000000820000000400000000000044010000000006000000000000000000000000000007000000000000000000000000000000000600004204000000000000CA00000000000000D000000062000000010000008204000000000000A00400006200000002000000D2040000000000007102000041000000D20400000000000007000000E5010000000600009205000000000000720000002C0000002C0000000000000001000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF38010000200000003B01000012010000CA00000000000000D000000080030000D00500000000000013000000010000009A010000000000000003000062000000110000000000000040020000620000000200000082000000040000000101314401040000000700005203000000000000CA00000000000000D00000008003000000000000A00300000000000000000000070000000000000000000000000000000007000000000000820000000400000038F3E2771004000030040000200000004204000000000000CA00000000000000D000000062000000030000008204000000000000A00400006200000002000000D2040000000000007702000041000000D204000000000000AF020000E50100000007000082040000000000001005000062000000010000004005000000070000820400000000000060050000620000000100000001000000000700009205000000000000720000002C0000002C0000000000000001000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF3B010000200000009202000012010000CA00000000000000D000000080030000D00500000000000013000000E2050000000000004F0000004B00000020000000EA00000000000000000100006200000006000000F0020000520000000900000066696C656E616D657300060000520000000800000073706C697474657200070000520000000B0000006469726563746F726965730602090052656374616E676C6500000000D2040000000000000D00000041000000D2040000000000000D0000000D0000004204000000000000CA00000000000000D000000062000000010000008204000000000000A00400006200000002000000D2040000000000000100000001000000D2040000000000003105000031020000400200009205000000000000720000002C0000002C0000000000000001000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000000000009802000018010000CA00000000000000D00000006200000003000000F00200000006000000070000D00500000000000013000000EA00000000000000000100006200000004000000400200005200000009000000636F6E7461696E65729A010000000000009A00000000000000C00100005200000008000000436F6D626F426F78620000001100000000000000A0010000620000000200000082000000040000000206314401040000D00900005203000000000000CA00000000000000D00000008003000000000000A0030000000000000000000007000000000000000000000000000000D00900000000000082000000040000003705E2771004000030040000910100004204000000000000CA00000000000000D000000062000000020000008204000000000000A00400006200000002000000D2040000000000000D0000000F000000D2040000000000001501000037000000D0090000820400000000000010050000620000000100000040050000D00900009205000000000000720000002C0000002C0000000000000001000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF06000000070000009000000022000000CA00000000000000D000000080030000D0050000000000001300000052000000060000006472697665730000000046050700020000004D656E75426172000000000000000010000000620000000000000052000000000000000000000000000000000000000000000001000000000000000000000000000000000000000100000000000000000000004204000000000000CA00000000000000D000000062000000030000008204000000000000A00400006200000002000000D2040000000000000B0000000B000000D204000000000000410500006B020000A00100008204000000000000BA000000000000005200000005000000746578743A620000000100000052000000160000004475706C69636174652046696C652046696E64657232A00100008204000000000000BA0000000000000052000000080000006D656E754261723A6200000001000000400B0000A00100009205000000000000720000002C0000002C0000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0500000005000000A50200003A010000CA00000000000000D00000006200000002000000D009000040020000D00500000000000015000000460504000300000049636F6E0000000000000000100000000E02110053544253696E676C65746F6E50726F7879000000009A000000000000005200000007000000446F6C7068696E5200000018000000496D61676552656C617469766546696C654C6F6361746F72BA00000000000000520000000700000063757272656E74520000000D0000005368656C6C566965772E69636F0E021F0053544245787465726E616C5265736F757263654C69627261727950726F7879000000005200000010000000646F6C7068696E64723030352E646C6C00000000'))!

(ResourceIdentifier class: DuplicateFileShell3 name: 'DuplicateFileView3') assign: (Object fromBinaryStoreBytes:
(ByteArray fromHexString: '2153544220312046020C0001000000566965775265736F75726365000000000E0124005354425265736F757263655354424279746541727261794163636573736F7250726F787900000000720000001A130000215354422031204E080C000A0000005354425669657750726F7879000000009A000000000000005200000010000000446F6C7068696E204D5650204261736552000000090000005368656C6C56696577620000001B0000000000000000000000620000000200000001009E0101000200A001000000000000460103000100000052474200000000FFFFFF010000000007000000000000000000000000000000A001000006070C00426F726465724C61796F7574000000000100000001000000000000009A010000000000009A000000000000005200000014000000446F6C7068696E20436F6E74726F6C20426172735200000009000000537461747573426172620000001200000000000000A0010000620000000200000082000000040000000401004401000000400200000000000006010B0053797374656D436F6C6F72000000001F00000000000000070000000000000006040400466F6E74000000000000000010000000060107004C4F47464F4E5400000000720000003C000000F1FFFFFF000000000000000000000000900100000000000003020122417269616C00000000000000000000000000000000000000000000000000000006020500506F696E7400000000D5000000D50000000000000040020000000000008200000008000000E902FFFF00000000EA0000000000000000010000620000000200000006070D005374617475734261724974656D0000000001000000FFFFFFFF400200000000000006040C00426C6F636B436C6F737572650000000026030D004D6574686F64436F6E74657874010000000100000026051200436F6D70696C656445787072657373696F6E040000008F010000500200005200000004000000646F4974620000000200000052000000720000002873656C6620766965774E616D65643A20277465787427292067657454657874426C6F636B3A205B203A6E6F74696669636174696F6E207C206E6F74696669636174696F6E206E6F744E696C206966547275653A205B206E6F74696669636174696F6E206465736372697074696F6E205D5D6200000001000000CA000000000000009A000000000000005200000007000000446F6C7068696E520000000E000000506F6F6C44696374696F6E61727962000000000000007200000013000000391DAFFB01090059119D7811A06A3C6AB16469520000000400000074657874BA00000000000000520000000A000000766965774E616D65643ABA00000000000000520000000B0000006465736372697074696F6EBA00000000000000520000000D00000067657454657874426C6F636B3A40020000000000000300000011000000E00300009203000000000000B2030000010000000100000026050E00436F6D70696C65644D6574686F64020000008F01000070030000BA00000000000000520000001400000064656661756C74476574496D616765426C6F636B039AA553720000000A000000FB01050059119E9F6A69BA00000000000000520000000400000069636F6EBA00000000000000520000000A000000696D616765496E6465788003000000000000030000000B000000300500000E02110053544253696E676C65746F6E50726F7879000000009A00000000000000C0010000520000001000000049636F6E496D6167654D616E61676572BA00000000000000520000000700000063757272656E74520000000400000074657874CA00000000000000D0000000620000000100000080030000060411005374617475734261724E756C6C4974656D00000000010200000100000040020000000000000000000006010F004D65737361676553657175656E636500000000CA00000000000000D0000000620000000100000006030B004D65737361676553656E6400000000BA00000000000000520000001000000063726561746541743A657874656E743A6200000002000000220300000000000001000000050200002203000000000000310500002D0000004002000006010F0057494E444F57504C4143454D454E5400000000720000002C0000002C0000000000000001000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000020100009802000018010000CA00000000000000D00000007004000030030000000000001300000000000000000000009A010000000000009A00000000000000C0010000520000000D000000436F6E7461696E657256696577620000000F00000000000000A001000062000000020000008200000004000000000000440100020050070000000000000202000000000000818181010000000007000000000000000000000000000000500700000602120050726F706F7274696F6E616C4C61796F757400000000EA00000000000000F000000062000000020000009A010000000000009A00000000000000C0010000520000000800000053706C6974746572620000000C00000000000000500700006200000002000000820000000400000000000044010000000008000000000000000000000000000007000000000000000000000000000000000800006206000000000000CA00000000000000D00000006200000001000000A206000000000000C00600006200000002000000220300000000000001000000FF00000022030000000000003105000009000000000800001207000000000000720000002C0000002C0000000000000001000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF000000007F0000009802000083000000CA00000000000000D0000000700400003003000000000000130000000100000010000000EA000000000000000001000062000000020000009A010000000000009A00000000000000C001000052000000070000004C697374426F78620000001100000000000000500700006200000002000000820000000400000001013144010400002009000046030900020000004C6973744D6F64656C00000000CA00000000000000D00000007004000000000000BA050000000000009A0000000000000050040000520000000C000000536561726368506F6C696379BA0000000000000052000000080000006964656E746974790000000000000000070000000000000000000000000000002009000000000000820000000400000038F3E2779A00000000000000C0010000520000001100000042617369634C69737441627374726163746200000000000000200000006206000000000000CA00000000000000D00000006200000003000000A206000000000000C0060000620000000200000022030000000000000100000007010000220300000000000031050000FF00000020090000A206000000000000BA000000000000005200000017000000626173696353656C656374696F6E734279496E6465783A6200000001000000620000000000000020090000A206000000000000BA000000000000005200000011000000686F72697A6F6E74616C457874656E743A620000000100000001000000200900001207000000000000720000002C0000002C0000000000000001000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000830000009802000002010000CA00000000000000D000000070040000300300000000000013000000520000000B0000006469726563746F72696573000000006206000000000000CA00000000000000D00000006200000001000000A206000000000000C006000062000000020000002203000000000000010000000100000022030000000000003105000005020000500700001207000000000000720000002C0000002C0000000000000001000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000000000009802000002010000CA00000000000000D000000062000000030000009A0100000000000060070000620000000F0000000000000050070000620000000200000082000000040000000000004401000200300C000000000000000000000000000007000000000000000000000000000000300C0000C207000000000000EA00000000000000F000000062000000060000009A0100000000000030090000620000001100000000000000300C0000620000000200000082000000040000000101314401040000A00C00008209000000000000CA00000000000000D00000007004000000000000B0090000000000000000000007000000000000000000000000000000A00C000000000000820000000400000038F3E277100A0000300A0000200000006206000000000000CA00000000000000D00000006200000003000000A206000000000000C006000062000000020000002203000000000000010000000100000022030000000000007B000000FF000000A00C0000A206000000000000C00A00006200000001000000F00A0000A00C0000A206000000000000100B0000620000000100000001000000A00C00001207000000000000720000002C0000002C0000000000000001000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000000000003D0000007F000000CA00000000000000D000000070040000300300000000000013000000060208004672616374696F6E0000000071000000570200009A0100000000000010080000620000000C00000000000000300C0000620000000200000082000000040000000000004401000000100E000000000000000000000000000007000000000000000000000000000000100E00006206000000000000CA00000000000000D00000006200000001000000A206000000000000C0060000620000000200000022030000000000007B00000001000000220300000000000009000000FF000000100E00001207000000000000720000002C0000002C0000000000000001000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF3D00000000000000410000007F000000CA00000000000000D000000070040000300300000000000013000000010000009A0100000000000030090000620000001100000000000000300C0000620000000200000082000000040000000101314401040000F00E00008209000000000000CA00000000000000D00000007004000000000000B0090000000000000000000007000000000000000000000000000000F00E000000000000820000000400000038F3E277100A0000300A0000200000006206000000000000CA00000000000000D00000006200000003000000A206000000000000C00600006200000002000000220300000000000083000000010000002203000000000000AF040000FF000000F00E0000A206000000000000C00A00006200000001000000F00A0000F00E0000A206000000000000100B0000620000000100000001000000F00E00001207000000000000720000002C0000002C0000000000000001000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF4100000000000000980200007F000000CA00000000000000D000000070040000300300000000000013000000F20D0000000000003D0400005702000020000000EA00000000000000000100006200000004000000A00C00005200000006000000647269766573F00E0000520000000900000066696C656E616D6573000000006206000000000000CA00000000000000D00000006200000001000000A206000000000000C0060000620000000200000022030000000000000100000001000000220300000000000031050000FF000000300C00001207000000000000720000002C0000002C0000000000000001000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0000000000000000980200007F000000CA00000000000000D00000006200000003000000A00C0000100E0000F00E00003003000000000000130000000008000020090000300300000000000013000000EA0000000000000000010000700400000000000046050700020000004D656E75426172000000000000000010000000620000000100000046050400020000004D656E75000000000000000010000000620000000100000046040F0002000000436F6D6D616E644D656E754974656D00000000010000004605120004000000436F6D6D616E644465736372697074696F6E00000000BA0000000000000052000000040000006578697452000000050000004526786974B12000000100000000000000000000000000000052000000050000002646696C65000000005200000000000000000000000000000006031000416363656C657261746F725461626C65000000000000000010000000620000000100000006020B004173736F63696174696F6E00000000B1200000E01100000000000001000000000000000000000000000000000000000100000000000000000000006206000000000000CA00000000000000D00000006200000003000000A206000000000000C0060000620000000200000022030000000000000B0000000B0000002203000000000000410500006B020000A0010000A206000000000000BA000000000000005200000005000000746578743A620000000100000052000000170000004475706C69636174652046696C652046696E6465722033A0010000A206000000000000BA0000000000000052000000080000006D656E754261723A620000000100000060110000A00100001207000000000000720000002C0000002C0000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0500000005000000A50200003A010000CA00000000000000D000000062000000020000005007000040020000300300000000000015000000460504000300000049636F6E0000000000000000100000000E02110053544253696E676C65746F6E50726F7879000000009A000000000000005200000007000000446F6C7068696E5200000018000000496D61676552656C617469766546696C654C6F6361746F72BA00000000000000520000000700000063757272656E74520000000D0000005368656C6C566965772E69636F0E021F0053544245787465726E616C5265736F757263654C69627261727950726F7879000000005200000010000000646F6C7068696E64723030352E646C6C00000000'))!
